// Real loopback HTTP/Auth/PostgreSQL only. Run the app without AI provider keys.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const database = new URL(process.env.DATABASE_URL);
assert.equal(database.hostname, '127.0.0.1');
assert.equal(database.port, '54322');
assert(!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const db = new PrismaClient();
let identity, user, session;
const routes = [['profil/photo-morphologie', 'morphologie'], ['profil/montre', 'montre'],
  ['programme/motion-check', 'mouvement'], ['nutrition/photo-repas', 'repas'], ['nutrition/menu-restaurant', 'menu']];
const url = route => 'http://127.0.0.1:3050/api/' + route;
async function main() {
  const email = `vision-input-${randomUUID()}@example.test`, password = randomUUID() + 'Aa1!';
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null); identity = created.data.user;
  user = await db.user.create({ data: { email, supabaseAuthId: identity.id,
    subscription: { create: { stripeCustomerId: 'local-fixture-' + randomUUID(), status: 'ACTIVE' } } } });
  const login = await auth.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null); session = login.data.session;
  const authorization = { Authorization: `Bearer ${session.access_token}` };
  for (const [route, scope] of routes) {
    const consent = { ...authorization, 'x-coai-ai-image-consent': 'anthropic-image-v1:' + scope };
    for (const wrong of [undefined, 'anthropic-image-v0:' + scope, 'anthropic-image-v1:invalid']) {
      const headers = { ...authorization };
      if (wrong) headers['x-coai-ai-image-consent'] = wrong;
      const response = await fetch(url(route), { method: 'POST', headers, body: new FormData() });
      assert.equal(response.status, 403, route);
      assert.equal((await response.json()).code, 'AI_IMAGE_CONSENT_REQUIRED');
    }
    const broken = await fetch(url(route), { method: 'POST', headers: { ...consent,
      'content-type': 'multipart/form-data; boundary=interrupted' }, body: '--interrupted\r\nPRIVATE-incomplete-body' });
    assert.equal(broken.status, 400, route);
    assert.match((await broken.json()).error, /incomplet/);
    const empty = new FormData(); empty.set('file', new Blob([], { type: 'image/png' }), 'empty.png');
    empty.set('exercice', 'Squat');
    const rejected = await fetch(url(route), { method: 'POST', headers: consent, body: empty });
    assert.equal(rejected.status, 400, route);
    assert.match((await rejected.json()).error, /vide/);
  }
  assert.equal(await db.profile.count({ where: { userId: user.id } }), 0);
  const brokenHealth = await fetch(url('profil/montre'), { method: 'POST',
    headers: { ...authorization, 'content-type': 'application/json' }, body: '{PRIVATE-interrupted' });
  assert.equal(brokenHealth.status, 400);
  assert.match((await brokenHealth.json()).error, /incomplète/);
  const health = await fetch(url('profil/montre'), { method: 'POST',
    headers: { ...authorization, 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'healthkit', pasMoyenParJour: 7500 }) });
  assert.equal(health.status, 200);
  assert.equal((await db.profile.findUnique({ where: { userId: user.id } })).pasMoyenParJour, 7500);
  console.log('PASS 27 real local HTTP cases: five scoped image-consent gates; interrupted/empty inputs rejected with readable JSON; no profile mutation on failure; structured HealthKit persisted independently. No valid image submitted.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  try {
    if (session) assert.equal((await auth.auth.signOut({ scope: 'global' })).error, null);
    if (user) await db.user.deleteMany({ where: { id: user.id, supabaseAuthId: identity.id } });
    if (identity) assert.equal((await admin.auth.admin.deleteUser(identity.id)).error, null);
    if (user) assert.equal(await db.user.count({ where: { id: user.id } }), 0);
    console.log('Disposable local account, fixture subscription and profile removed; session revoked.');
  } catch (error) { console.error('Local cleanup failed:', error.message); process.exitCode = 1; }
  await db.$disconnect();
});
