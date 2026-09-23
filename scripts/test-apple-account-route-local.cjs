const assert = require('node:assert/strict');
const { createServerClient } = require('@supabase/ssr');
const { PrismaClient } = require('@prisma/client');
const endpoint = 'http://127.0.0.1:3050/api/ios/apple/account';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321', 'Local Auth only');
const dbURL = new URL(process.env.DATABASE_URL);
assert.equal(dbURL.hostname, '127.0.0.1');
assert.equal(dbURL.port, '54322');
const database = new PrismaClient();
const jar = new Map();
const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: updates => updates.forEach(({name, value}) => jar.set(name, value)) },
});
async function post(headers = {}, body = {}) {
  return fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
function privateResponse(response) {
  assert.match(response.headers.get('cache-control'), /private/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('vary'), /Authorization/);
}
async function main() {
  const catalogueURL = 'http://127.0.0.1:3050/api/ios/apple/catalogue';
  const anonymousCatalogue = await fetch(catalogueURL);
  assert.equal(anonymousCatalogue.status, 401); privateResponse(anonymousCatalogue);
  const anonymous = await post();
  assert.equal(anonymous.status, 401); privateResponse(anonymous);
  assert.equal((await post({ Authorization: 'Bearer invalid-local-token' })).status, 401);
  assert.equal((await post({ Origin: 'https://unrelated.example' })).status, 403);
  assert.equal((await post({ 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await fetch(endpoint)).status, 405);
  const { data, error } = await auth.auth.signInWithPassword({ email: 'coai-qa-20260923-1015@example.test', password: 'Coai-QA-local-2026!' });
  assert.equal(error, null); assert(data.session);
  const catalogueResponse = await fetch(catalogueURL, { headers: { Authorization: `Bearer ${data.session.access_token}` } });
  assert.equal(catalogueResponse.status, 200); privateResponse(catalogueResponse);
  const catalogue = await catalogueResponse.json();
  assert.deepEqual(catalogue.products, [
    { id: 'fr.coai.mobile.essentiel.monthly', period: 'P1M' },
    { id: 'fr.coai.mobile.essentiel.annual', period: 'P1Y' },
  ]);
  assert.deepEqual(catalogue.introductoryOffer, { mode: 'freeTrial', period: 'P7D', eligibility: 'storekit' });
  assert(!JSON.stringify(catalogue).includes('Price'));
  const user = await database.user.findUnique({ where: { supabaseAuthId: data.user.id }, select: { id: true } });
  assert(user);
  const before = JSON.stringify(await database.subscription.findMany({ orderBy: { id: 'asc' } }));
  const response = await post({ Authorization: `Bearer ${data.session.access_token}` }, {
    userId: 'another-account', appAccountToken: '00000000-0000-0000-0000-000000000000', plan: 'PREMIUM',
  });
  assert.equal(response.status, 200, 'Native bearer response'); privateResponse(response);
  const payload = await response.json();
  assert.deepEqual(Object.keys(payload), ['appAccountToken']);
  const stored = await database.applePurchaseAccount.findUnique({ where: { userId: user.id } });
  assert.equal(payload.appAccountToken, stored.accountToken, 'Only authenticated user binding');
  const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  const cookieResponse = await post({ Cookie: cookie, Origin: 'http://localhost:3050' });
  assert.equal(cookieResponse.status, 200, 'Configured public origin with WebView cookies'); privateResponse(cookieResponse);
  assert.deepEqual(await cookieResponse.json(), payload, 'WebView cookies and native bearer agree');
  const mixed = await post({ Cookie: cookie, Authorization: 'Bearer invalid-local-token' });
  assert.equal(mixed.status, 401, 'Invalid explicit bearer must not fall back to cookie');
  const repeated = await Promise.all(Array.from({length: 6}, () => post({Authorization: `Bearer ${data.session.access_token}`})));
  for (const result of repeated) { assert.equal(result.status, 200); assert.deepEqual(await result.json(), payload); }
  assert.equal(JSON.stringify(await database.subscription.findMany({ orderBy: { id: 'asc' } })), before);
  console.log('PASS: real local HTTP/Auth/DB flow, bearer + cookie, stable binding, forged fields ignored, invalid/anonymous/cross-origin denied, no cache, Stripe unchanged');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => database.$disconnect());
