// Runtime upgrade regression: real HTTP/Auth/Postgres, disposable local users,
// own COAI media and synthetic programme data. No purchase or paid AI call.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');
const { PrismaClient } = require('@prisma/client');
const base = 'http://127.0.0.1:3052';
assert.equal(process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3052');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const url = new URL(process.env.DATABASE_URL);
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '54322');
assert.equal(url.pathname, '/postgres');
const db = new PrismaClient();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const fixtures = [];
async function fixture() {
  const email = `runtime-http-${randomUUID()}@example.test`, password = `${randomUUID()}Aa1!`;
  const identity = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(identity.error, null); assert(identity.data.user);
  const row = { email, authId: identity.data.user.id, auth: null };
  fixtures.push(row);
  row.user = await db.user.create({ data: { email, supabaseAuthId: row.authId } });
  const jar = new Map();
  row.auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: updates => updates.forEach(({ name, value }) => jar.set(name, value)),
    } });
  const login = await row.auth.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null); assert(login.data.session);
  row.bearer = `Bearer ${login.data.session.access_token}`;
  row.cookie = [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  return row;
}
async function get(path, row, cookies = false) {
  return fetch(base + path, { redirect: 'manual', headers: row
    ? cookies ? { Cookie: row.cookie } : { Authorization: row.bearer } : {} });
}
async function main() {
  for (const path of ['/', '/sign-in', '/sign-up', '/diagnostic', '/cgv', '/confidentialite']) {
    assert.equal((await get(path)).status, 200, path);
  }
  const protectedPage = await get('/programme/entrainement?onboarding=1');
  assert.equal(protectedPage.status, 307);
  assert.match(protectedPage.headers.get('location'), /sign-in.*redirect_to=/);
  const invitation = await get('/invitation/abcd234');
  assert.equal(invitation.status, 307);
  assert.match(invitation.headers.get('location'), /\/diagnostic/);
  assert.match(invitation.headers.get('set-cookie'), /ABCD234/);
  assert.equal((await get('/auth/callback?error_code=access_denied')).status, 307);
  const first = await fixture(), second = await fixture();
  const wrongOwner = await fetch(base + '/api/seances', {method:'POST',headers:{
    Cookie:first.cookie,'Content-Type':'application/json','X-COAI-Expected-Owner':second.user.id},
    body:JSON.stringify({date:new Date().toISOString(),exercices:[],source:'PROGRAMME'})});
  assert.equal(wrongOwner.status,409,'Combined runtime must preserve native owner protection');
  assert.match(wrongOwner.headers.get('cache-control'),/private.*no-store/);
  assert.equal(await db.seanceLog.count({where:{userId:{in:[first.user.id,second.user.id]}}}),0,
    'A mismatched owner must create no workout for either member');
  await db.profile.create({ data: { userId: first.user.id, sexe: 'homme' } });
  await db.subscription.create({ data: { userId: first.user.id,
    stripeCustomerId: `qa-runtime-${randomUUID()}`, status: 'ACTIVE' } });
  const name = 'Séance fictive QA transport';
  const today = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long' }).format(new Date());
  await db.programmeGenerated.create({ data: { userId: first.user.id, pilier: 'ENTRAINEMENT',
    statut: 'VALIDE', contenu: { titre: name, seances: [{ nom: name, jour: today.slice(0, 3).toUpperCase(),
      echauffement: 'Mobilité de préparation QA', retourAuCalme: 'Retour au calme QA',
      exercices: [{ nom: 'Développé couché (barre)', series: '2', repetitions: '8', repos: '60 s' }] }] } } });
  await db.seanceLog.create({ data: { userId: first.user.id,
    date: new Date(Date.now() - 60000), exercices: [], source: 'PROGRAMME' } });
  for (const path of ['/dashboard', '/programme/entrainement?onboarding=1',
    '/compte/profil?onboarding=1', '/suivi/alimentation?jour=2026-10-13', '/programme/recettes']) {
    const response = await get(path, first, true);
    assert.equal(response.status, 200, path);
    assert(!/Internal Server Error|Application error:/.test(await response.text()), path);
  }
  const progress = await get('/api/ios/progress', first);
  assert.equal(progress.status, 200);
  assert.equal((await progress.json()).totalSessions, 1);
  for (const Authorization of ['Basic invalid', '', 'Bearer invalid']) {
    const denied = await fetch(base + '/api/ios/progress', {
      headers: { Cookie: first.cookie, Authorization },
    });
    assert.equal(denied.status, 401, 'An explicit invalid token must not use the cookie account');
  }
  assert.equal((await (await get('/api/ios/progress', second)).json()).totalSessions, 0);
  const recipes = await get('/api/ios/nutrition/recettes', first);
  assert.equal(recipes.status, 200); const library = await recipes.json();
  assert.equal(library.fullCatalogue, true); assert(library.recipes.length > 3);
  assert.equal((await (await get('/api/ios/nutrition/recettes', second)).json()).recipes.length, 3);
  const workout = await get('/api/ios/workout/today?seance=0', first);
  assert.equal(workout.status, 200); const session = await workout.json();
  assert.equal(session.name, name); assert.equal(session.exercises.length, 1);
  assert(session.exercises[0].photo && session.exercises[0].video);
  const todayWorkout = await get('/api/ios/workout/today', first);
  assert.equal(todayWorkout.status, 200, 'An abbreviated Paris weekday must appear as today’s workout');
  assert.equal((await todayWorkout.json()).name, name);
  assert.equal((await get('/api/ios/workout/today?seance=0', second)).status, 404);
  for (const path of ['/api/programmes/fiche-complete', '/api/programmes/entrainement/pdf']) {
    const response = await get(path, first);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), /application\/pdf/);
    const pdf = Buffer.from(await response.arrayBuffer());
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-'); assert(pdf.length > 1000);
    assert.equal((await get(path, second)).status, 404, 'No other member programme is exported');
  }
  for (const equipment of ['Sans matériel', 'Salle de sport complète']) {
    const response = await fetch(`${base}/api/daily`, {
      method: 'POST', headers: { Authorization: first.bearer, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin', sleep: 'BON', energy: 'NORMALE', pain: false,
        availableMinutes: 60, equipementDuJour: equipment }),
    });
    assert.equal(response.status, 200);
    const daily = await response.json();
    assert.equal(daily.sourceSession.exercices.length, 1);
    assert.equal(daily.adaptedSession.exercices.length, equipment === 'Sans matériel' ? 0 : 1);
    const reloaded = await (await get('/api/daily', first)).json();
    assert.deepEqual(reloaded.adaptedSession, daily.adaptedSession, 'Equipment adaptation persists across requests');
  }
  const beforeMalformed = await (await get('/api/daily', first)).json();
  const malformed = await fetch(`${base}/api/daily`, { method: 'POST',
    headers: { Authorization: first.bearer, 'Content-Type': 'application/json' }, body: '{broken' });
  assert.equal(malformed.status, 400);
  assert.match((await malformed.json()).error, /Réessaie/);
  assert.deepEqual(await (await get('/api/daily', first)).json(), beforeMalformed,
    'Malformed payload must not modify the saved check-in');
  // Simulate an owned programme being corrected to a rest day, after an earlier check-in.
  await db.programmeGenerated.updateMany({ where: { userId: first.user.id, pilier: 'ENTRAINEMENT' },
    data: { contenu: { titre: name, seances: [] } } });
  const rest = await fetch(`${base}/api/daily`, { method: 'POST',
    headers: { Authorization: first.bearer, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'checkin', sleep: 'BON', energy: 'NORMALE', pain: false }) });
  assert.equal(rest.status, 200);
  const restDay = await rest.json();
  for (const key of ['sourceSession', 'adaptedSession', 'adaptation']) assert.equal(restDay[key], null);
  const restoredRest = await (await get('/api/daily', first)).json();
  assert.equal(restoredRest.adaptedSession, null, 'A rest day must not revive the old adapted workout');
  assert.equal(restoredRest.id, beforeMalformed.id, 'The daily check-in is updated, not duplicated');
  const optimized = await get('/_next/image?url=%2Fexercices%2Fback-squat-barre.jpg&w=640&q=95');
  assert.equal(optimized.status, 200);
  assert.match(optimized.headers.get('content-type'), /image\//);
  await first.auth.auth.signOut({ scope: 'global' });
  // A fresh anonymous request must not retain the preceding account's data.
  assert.equal((await get('/api/ios/progress')).status, 401);
}
async function run() {
  try { await main(); }
  finally {
    for (const row of fixtures) {
      if (row.auth) await row.auth.auth.signOut({ scope: 'global' });
      if (row.user) {
        await db.user.deleteMany({ where: { id: row.user.id, email: row.email, supabaseAuthId: row.authId } });
        assert.equal(await db.user.count({ where: { id: row.user.id } }), 0);
      }
      const removed = await admin.auth.admin.deleteUser(row.authId); assert.equal(removed.error, null);
    }
    await db.$disconnect();
  }
  console.log('PASS: Next runtime HTTP/Auth/DB, public/protected pages, async route params, cookie/bearer sessions, two-user recipe/progress/workout isolation, real PDF rendering and optimized image. Fixtures removed; no UI/production validation.');
}
run().catch(error => {
  console.error(error.message);
  console.error(error.stack?.split('\n').find(line => line.includes('scripts/test-runtime-http-local.cjs')) || '');
  process.exitCode = 1;
});
