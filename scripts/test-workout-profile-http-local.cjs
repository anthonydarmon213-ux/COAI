// Run against an already started, isolated local COAI server. Never production.
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {createClient} = require('@supabase/supabase-js');
const {createServerClient} = require('@supabase/ssr');
const {PrismaClient} = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const databaseURL = new URL(process.env.DATABASE_URL);
assert.equal(databaseURL.hostname, '127.0.0.1');
assert.equal(databaseURL.port, '54322');
const origin = 'http://127.0.0.1:3050';
const db = new PrismaClient();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {persistSession: false, autoRefreshToken: false},
});
const fixtures = [];
async function fixture() {
  const email = `coai-http-${randomUUID()}@example.test`, password = randomUUID() + 'aA1!';
  const {data, error} = await admin.auth.admin.createUser({email, password, email_confirm: true});
  assert.equal(error, null);
  const owned = {authId: data.user.id}; fixtures.push(owned);
  owned.user = await db.user.create({data: {email, supabaseAuthId: data.user.id}});
  const jar = new Map();
  owned.client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {getAll: () => [...jar].map(([name, value]) => ({name, value})),
      setAll: updates => updates.forEach(({name, value}) => jar.set(name, value))},
  });
  const signed = await owned.client.auth.signInWithPassword({email, password});
  assert.equal(signed.error, null);
  owned.bearer = {Authorization: `Bearer ${signed.data.session.access_token}`};
  owned.cookie = {Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ')};
  return owned;
}
async function main() {
  const endpoint = origin + '/api/seances';
  assert.equal((await fetch(endpoint)).status, 401);
  const a = await fixture(), b = await fixture();
  const payload = {date: new Date().toISOString(), source: 'PROGRAMME',
    exercices: [{nom: 'Test local', sets: [{set: 1, reps: 8, charge: 12}]}], energie: 4, difficulte: 3, douleur: 'AUCUNE'};
  const post = body => fetch(endpoint, {method: 'POST', headers: {...a.cookie, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const responses = await Promise.all([post(payload), post(payload), post(payload)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 200, 201]);
  const bodies = await Promise.all(responses.map(r => r.json()));
  assert.equal(new Set(bodies.map(row => row.id)).size, 1);
  const retry = await post({...payload, notes: 'Must not replace the original'});
  assert.equal(retry.status, 200); assert.equal((await retry.json()).notes, null);
  const history = await fetch(endpoint, {headers: a.bearer}); assert.equal(history.status, 200);
  const rows = await history.json(); assert.equal(rows.length, 1);
  assert.equal(rows[0].exercices[0].sets[0].charge, 12);
  assert.equal(await db.seanceLog.count({where: {userId: a.user.id}}), 1);
  const other = await fetch(endpoint, {headers: b.cookie}); assert.equal(other.status, 200);
  assert.deepEqual(await other.json(), []);
  assert.equal((await fetch(endpoint, {headers: {...a.cookie, Authorization: 'Bearer invalid'}})).status, 401);
  const malformed = await fetch(endpoint, {method: 'POST', headers: {...a.cookie, 'Content-Type': 'application/json'}, body: '{'});
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), {error: 'Données de séance illisibles. Réessaie l’enregistrement.'});
  assert.equal(await db.seanceLog.count({where: {userId: a.user.id}}), 1);
  console.log('PASS HTTP workout: cookie + bearer, concurrency/retry, history, account isolation, invalid token/JSON');

  const updateProfile = body => fetch(origin + '/api/profil', {
    method: 'PUT', headers: {...a.cookie, 'Content-Type': 'application/json'}, body: JSON.stringify(body),
  });
  let response = await updateProfile({poidsKg: 80, tailleCm: 180, age: 35, objectifs: 'Test local', cycleMenstruelSuivi: true});
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /private, no-store/);
  response = await updateProfile({poidsKg: null, tailleCm: null, age: null, objectifs: '', cycleMenstruelSuivi: false, userId: b.user.id});
  assert.equal(response.status, 200);
  const profile = await db.profile.findUnique({where: {userId: a.user.id}});
  assert.equal(profile.poidsKg, null); assert.equal(profile.tailleCm, null); assert.equal(profile.age, null);
  assert.equal(profile.objectifs, ''); assert.equal(profile.cycleMenstruelSuivi, false);
  assert.equal(await db.profile.count({where: {userId: b.user.id}}), 0);
  assert.equal((await updateProfile({poidsKg: -1})).status, 400);
  assert.equal((await db.profile.findUnique({where: {userId: a.user.id}})).poidsKg, null);
  console.log('PASS HTTP profile: persisted edits, cleared values/opt-out, invalid values rejected, forged ownership ignored');
  console.log('LIMIT: local HTTP/Auth/DB, not browser UI, physical iPhone, production or Apple purchases');
}
async function cleanup() {
  const errors = [];
  for (const owned of fixtures) {
    try {
      if (owned.client) await owned.client.auth.signOut();
      if (owned.user) {
        await db.seanceLog.deleteMany({where: {userId: owned.user.id}});
        await db.profile.deleteMany({where: {userId: owned.user.id}});
        await db.user.delete({where: {id: owned.user.id}});
      }
      const {error} = await admin.auth.admin.deleteUser(owned.authId); assert.equal(error, null);
    } catch (error) { errors.push(error); }
  }
  await db.$disconnect();
  assert.equal(errors.length, 0, 'Local fixture cleanup failed');
  console.log('PASS temporary local fixtures cleaned');
}
main().catch(error => {console.error(error.message); process.exitCode = 1;})
  .finally(cleanup).catch(error => {console.error(error.message); process.exitCode = 1;});
