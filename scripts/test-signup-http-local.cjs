// Real LOCAL Auth + captured confirmation email + HTTP registration + PostgreSQL.
// Run only through the local harness after checking SMTP points at local Mailpit.
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
const origin = 'http://localhost:3050';
const mailOrigin = 'http://127.0.0.1:54324';
const email = `coai-signup-${randomUUID()}@example.test`;
const password = randomUUID() + 'Aa1!';
const db = new PrismaClient();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const jar = new Map();
const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: updates => updates.forEach(({ name, value }) => jar.set(name, value)) },
});
let authId, messageId;
const cookie = () => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
const register = (body, authenticated = true) => fetch(origin + '/api/compte/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Cookie: cookie() } : {}) },
  body: JSON.stringify(body),
});
(async () => {
  try {
    const signed = await client.auth.signUp({ email, password, options: {
      data: { given_name: 'Test inscription' },
      emailRedirectTo: origin + '/auth/callback?redirect_to=%2Fbienvenue',
    } });
    assert.equal(signed.error, null); assert(signed.data.user); authId = signed.data.user.id;
    assert.equal(signed.data.session, null, 'Email confirmation required');
    assert.equal((await register({ consentRgpd: true, consentSante: true }, false)).status, 401);
    assert.equal(await db.user.count({ where: { supabaseAuthId: authId } }), 0);
    for (let i = 0; i < 15 && !messageId; i++) {
      const inbox = await (await fetch(mailOrigin + '/api/v1/messages')).json();
      const message = inbox.messages.find(item => item.To.some(to => to.Address === email));
      messageId = message?.ID;
      if (!messageId) await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert(messageId, 'Confirmation received only in local Mailpit');
    const message = await (await fetch(mailOrigin + '/api/v1/message/' + messageId)).json();
    const links = (message.HTML + '\n' + message.Text).match(/https?:\/\/[^\s"<>]+/g) || [];
    const confirmation = links.map(link => link.replaceAll('&amp;', '&')).find(link => link.includes('/auth/v1/verify?'));
    assert(confirmation); const url = new URL(confirmation);
    assert(['http://localhost:54321', 'http://127.0.0.1:54321'].includes(url.origin));
    const verified = await fetch(url, { redirect: 'manual' });
    assert.equal(verified.status, 303);
    assert(!new URL(verified.headers.get('location')).hash.includes('error'));
    const callback = new URL(verified.headers.get('location'));
    assert.equal(callback.origin, origin); assert.equal(callback.pathname, '/auth/callback');
    assert(callback.searchParams.get('code'));
    const missingVerifier = process.argv.includes('--missing-verifier');
    const exchanged = await fetch(callback, { redirect: 'manual', headers: missingVerifier ? {} : { Cookie: cookie() } });
    assert.equal(exchanged.status, 307);
    const destination = new URL(exchanged.headers.get('location'));
    assert.equal(destination.origin, origin);
    assert.equal(destination.pathname, missingVerifier ? '/sign-in' : '/completer-inscription');
    assert.equal(destination.searchParams.get('redirect_to'), '/bienvenue');
    if (missingVerifier) {
      assert(destination.searchParams.get('error'));
      assert.equal((await register({ consentRgpd: true, consentSante: true }, false)).status, 401);
      // Confirmation remains effective even if a different browser lacks the verifier.
      const login = await client.auth.signInWithPassword({ email, password });
      assert.equal(login.error, null); assert(login.data.session);
    } else {
      // Use only cookies set by the real callback: no password login to hide an exchange failure.
      for (const header of exchanged.headers.getSetCookie()) {
        const pair = header.split(';')[0], split = pair.indexOf('=');
        jar.set(pair.slice(0, split), decodeURIComponent(pair.slice(split + 1)));
      }
      const completion = await fetch(destination, { redirect: 'manual', headers: { Cookie: cookie() } });
      assert.equal(completion.status, 200);
      assert((await completion.text()).includes('Finalise ton compte'));
    }
    for (const consent of [{ consentRgpd: false, consentSante: true }, { consentRgpd: true, consentSante: false }]) {
      assert.equal((await register(consent)).status, 400);
      assert.equal(await db.user.count({ where: { supabaseAuthId: authId } }), 0);
    }
    await db.diagnosticLead.create({ data: { email: email.toUpperCase(), resultEmailSentAt: new Date(),
      reponses: { objectif: 'Rester en forme', niveau: 'Débutant', duree: '45 minutes', frequence: '2 fois par semaine' } } });
    const response = await register({ consentRgpd: true, consentSante: true, prenom: 'Test inscription', parrainageCode: 'INEXISTANT' });
    assert.equal(response.status, 201);
    const user = await db.user.findUnique({ where: { supabaseAuthId: authId }, include: { profile: true } });
    assert(user.consentRgpdAt); assert(user.consentSanteAt); assert.equal(user.parraineParId, null);
    assert.equal(user.profile.dureeSeanceMinutes, 45); assert.equal(user.profile.objectifs, 'Rester en forme');
    await db.profile.update({ where: { userId: user.id }, data: { dureeSeanceMinutes: 30 } });
    const retried = await Promise.all([1, 2, 3].map(() => register({ consentRgpd: true, consentSante: true, prenom: 'Ne pas écraser' })));
    assert(retried.every(result => result.status === 201));
    const persisted = await db.user.findUnique({ where: { id: user.id }, include: { profile: true } });
    assert.equal(persisted.prenom, 'Test inscription'); assert.equal(persisted.profile.dureeSeanceMinutes, 30);
    assert.equal(await db.user.count({ where: { supabaseAuthId: authId } }), 1);
    const welcome = await fetch(origin + '/bienvenue', { headers: { Cookie: cookie() }, redirect: 'manual' });
    assert.equal(welcome.status, 200); assert(!(await welcome.text()).includes('NEXT_REDIRECT'));
    console.log('PASS local signup: real email/callback ' + (missingVerifier ? 'refused without verifier, password recovery works' : 'sets authenticated cookies without password login') + ', consent gates, diagnostic recovery, retries preserve profile, welcome accessible. No native callback or production claim.');
  } finally {
    await client.auth.signOut();
    if (authId) {
      const user = await db.user.findUnique({ where: { supabaseAuthId: authId } });
      if (user) { await db.profile.deleteMany({ where: { userId: user.id } }); await db.user.delete({ where: { id: user.id } }); }
      const removed = await admin.auth.admin.deleteUser(authId); assert.equal(removed.error, null);
    }
    await db.diagnosticLead.deleteMany({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (messageId) assert.equal((await fetch(mailOrigin + '/api/v1/messages', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ IDs: [messageId] }) })).status, 200);
    await db.$disconnect();
    console.log('Temporary signup account, diagnostic and local email cleaned');
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
