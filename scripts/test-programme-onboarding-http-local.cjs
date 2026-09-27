// Real local Auth/HTTP/PostgreSQL; synthetic access, never a payment test.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');
const { PrismaClient } = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://localhost:54321');
assert.equal(process.env.DATABASE_URL, 'postgresql://postgres:postgres@127.0.0.1:54322/postgres');
for (const key of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  assert.equal(JSON.parse(Buffer.from(process.env[key].split('.')[1], 'base64url')).iss, 'supabase-demo');
}
for (const key of ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'TWILIO_AUTH_TOKEN']) assert(!process.env[key], key);
const origin = 'http://localhost:3050';
const db = new PrismaClient();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const jar = new Map();
const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: updates => updates.forEach(({ name, value }) => jar.set(name, value)) },
});
const cookie = () => ({ Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') });
let authId, userId;
(async () => {
  try {
    const email = `coai-onboarding-${randomUUID()}@example.test`, password = randomUUID() + 'Aa1!';
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.equal(created.error, null); authId = created.data.user.id;
    const user = await db.user.create({ data: { email, supabaseAuthId: authId } }); userId = user.id;
    const signed = await client.auth.signInWithPassword({ email, password }); assert.equal(signed.error, null);
    const body = { objectifs: 'Prendre du muscle — activité quotidienne : Journée mixte : assis et debout',
      niveau: 'Débutant', equipementDisponible: 'Salle de sport complète', lieuEntrainement: 'Salle de sport',
      dureeSeanceMinutes: 45, frequenceEntrainement: '3 fois par semaine', age: 35, tailleCm: 178, poidsKg: 75,
      sexe: 'Homme', contraintesSante: '', antecedentsMedicaux: '', allergiesAlimentaires: '', habitudesAlimentaires: 'Repas structurés et équilibrés',
      qualiteSommeil: 'Bonne (7-8h, plutôt réparateur)' };
    const saved = await fetch(origin + '/api/profil', { method: 'PUT', headers: { ...cookie(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(saved.status, 200);
    const generate = () => fetch(origin + '/api/programmes/generate?mode=onboarding', { method: 'POST', headers: cookie() });
    assert.equal((await generate()).status, 403);
    await db.user.update({ where: { id: userId }, data: { programmeUnlockedAt: new Date() } });
    for (const constraint of [
      { contraintesSante: 'Douleur déclarée — fixture locale' },
      { antecedentsMedicaux: 'Antécédent déclaré — fixture locale' },
      { allergiesAlimentaires: 'Allergie déclarée — fixture locale' },
    ]) {
      const profile = await fetch(origin + '/api/profil', { method: 'PUT', headers: { ...cookie(), 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, ...constraint }) });
      assert.equal(profile.status, 200);
      const refused = await generate(); assert.equal(refused.status, 409);
      assert.equal((await refused.json()).requiresCoachReview, true);
      assert.equal(await db.programmeGenerated.count({ where: { userId } }), 0);
    }
    const reset = await fetch(origin + '/api/profil', { method: 'PUT', headers: { ...cookie(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(reset.status, 200);
    const firstResponses = await Promise.all([generate(), generate(), generate()]);
    const initialResults = [];
    for (const response of firstResponses) {
      const result = await response.json(); assert.equal(response.status, 201, JSON.stringify(result));
      assert.equal(result.echecs, 0); initialResults.push(result);
    }
    const initial = initialResults[0];
    assert.equal(initial.echecs, 0); assert.equal(initial.programmes.length, 3);
    const ids = initial.programmes.map(p => p.id).sort();
    for (const result of initialResults) assert.deepEqual(result.programmes.map(p => p.id).sort(), ids);
    for (const response of await Promise.all([generate(), generate()])) {
      assert.equal(response.status, 201);
      const resumed = await response.json(); assert.equal(resumed.reused, true);
      assert.deepEqual(resumed.programmes.map(p => p.id).sort(), ids);
    }
    const programmes = await db.programmeGenerated.findMany({ where: { userId } });
    assert.equal(programmes.length, 3); assert(programmes.every(p => p.statut === 'GENERE_IA'));
    assert.deepEqual(programmes.map(p => p.pilier).sort(), ['ENTRAINEMENT', 'NUTRITION', 'RECUPERATION']);
    for (const path of ['/programme/entrainement', '/programme/alimentation', '/programme/recuperation']) {
      const response = await fetch(origin + path, { headers: cookie(), redirect: 'manual' });
      assert.equal(response.status, 200, path);
      assert(!(await response.text()).includes('NEXT_REDIRECT'), path);
    }
    await db.user.update({ where: { id: userId }, data: { programmeUnlockedAt: null } });
    assert.equal((await generate()).status, 403);
    assert.equal(await db.programmeGenerated.count({ where: { userId } }), 3);
    console.log('PASS real local Auth/HTTP/DB: profile saved; access denied then explicitly granted in fixture; declared pain/history/allergy require coach review with no generic programme; three concurrent first requests create only three catalogue pillars; retries preserve IDs; three authenticated pages return 200; revoked access denied. No purchase or paid AI.');
  } finally {
    await client.auth.signOut({ scope: 'global' });
    if (userId) await db.user.delete({ where: { id: userId } });
    if (authId) { const deleted = await admin.auth.admin.deleteUser(authId); assert.equal(deleted.error, null); }
    await db.$disconnect();
    console.log('Exact disposable local fixture removed. Not a native visual or StoreKit test.');
  }
})().catch(error => { console.error(error.name + ': ' + error.message); process.exitCode = 1; });
