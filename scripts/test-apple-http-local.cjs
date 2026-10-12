// Real HTTP, Supabase Auth and PostgreSQL on local QA only. Owns every account
// it creates; no Apple purchase, receipt, email or production user is used.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');
const { PrismaClient } = require('@prisma/client');
const origin = process.env.COAI_APPLE_QA_ORIGIN;
assert.equal(origin, 'http://localhost:3052');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const url = new URL(process.env.DATABASE_URL);
assert.equal(url.protocol, 'postgresql:');
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '54322');
assert.equal(url.pathname, '/postgres');
assert.equal(process.env.APPLE_PURCHASES_ENABLED, 'false');
assert.equal(process.env.APPLE_NOTIFICATIONS_ENABLED, 'false');
const ledgerEnabled = process.env.APPLE_CONTENT_ACCESS_ENABLED === 'true';
if (ledgerEnabled) assert.equal(process.env.APPLE_STORE_ENVIRONMENT, 'Sandbox');
const base = 'http://127.0.0.1:3052';
const db = new PrismaClient();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const fixtures = [];
function verifyPrivate(response) {
  assert.match(response.headers.get('cache-control'), /private/);
  assert.match(response.headers.get('cache-control'), /no-store/);
}
async function post(path, headers = {}, body = {}) {
  const response = await fetch(base + path, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  verifyPrivate(response); return response;
}
async function fixture() {
  const email = `apple-http-${randomUUID()}@example.test`, password = `${randomUUID()}Aa1!`;
  const identity = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(identity.error, null); assert(identity.data.user);
  const row = { authId: identity.data.user.id, email, auth: null };
  fixtures.push(row);
  row.user = await db.user.create({ data: { supabaseAuthId: row.authId, email } });
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
async function main() {
  const account = '/api/ios/apple/account', catalogue = '/api/ios/apple/catalogue';
  const transactions = '/api/ios/apple/transactions';
  assert.equal((await post(account)).status, 401);
  assert.equal((await post(account, { Authorization: 'Bearer invalid' })).status, 401);
  assert.equal((await post(account, { Origin: 'https://unrelated.example' })).status, 403);
  assert.equal((await post(account, { 'Content-Type': 'text/plain' })).status, 415);
  const anonymousCatalogue = await fetch(base + catalogue);
  assert.equal(anonymousCatalogue.status, 401); verifyPrivate(anonymousCatalogue);
  assert.equal((await post('/api/webhooks/apple')).status, 503);
  assert.equal((await post(transactions, { Origin: origin })).status, 401);
  const first = await fixture(), second = await fixture();
  const request = row => post(account, { Authorization: row.bearer }, {
    userId: 'another-account', appAccountToken: randomUUID(), plan: 'PREMIUM' });
  const responses = await Promise.all(Array.from({ length: 8 }, () => request(first)));
  const states = [];
  for (const response of responses) { assert.equal(response.status, 200); states.push(await response.json()); }
  const initial = states[0];
  for (const state of states) assert.deepEqual(state, initial);
  assert.equal(initial.purchaseAllowed, false);
  assert.equal(initial.existingSubscription, false);
  assert.equal(initial.appleSubscription, ledgerEnabled ? false : null);
  const stored = await db.applePurchaseAccount.findUnique({ where: { userId: first.user.id } });
  assert.equal(initial.appAccountToken, stored.accountToken);
  assert.equal(await db.applePurchaseAccount.count({ where: { userId: first.user.id } }), 1);
  const cookies = await post(account, { Cookie: first.cookie, Origin: origin });
  assert.equal(cookies.status, 200); assert.deepEqual(await cookies.json(), initial);
  assert.equal((await post(account, { Cookie: first.cookie })).status, 403);
  assert.equal((await post(account, { Cookie: first.cookie, Authorization: 'Basic invalid' })).status, 401);
  assert.equal((await post(account, { Cookie: first.cookie, Authorization: 'Bearer invalid' })).status, 401);
  const offers = await fetch(base + catalogue, { headers: { Authorization: first.bearer } });
  assert.equal(offers.status, 200); verifyPrivate(offers);
  const publicCatalogue = await offers.json();
  assert.equal(publicCatalogue.purchasesEnabled, false);
  assert.deepEqual(publicCatalogue.products.map(p => p.id), [
    'fr.coai.mobile.essentiel.monthly', 'fr.coai.mobile.essentiel.annual']);
  const other = await post(account, { Authorization: second.bearer }, {
    userId: first.user.id, appAccountToken: initial.appAccountToken });
  assert.equal(other.status, 200);
  assert.notEqual((await other.json()).appAccountToken, initial.appAccountToken);
  const subscription = await db.subscription.create({ data: { userId: first.user.id,
    stripeCustomerId: `qa-apple-http-${randomUUID()}`, status: 'ACTIVE' } });
  for (const status of ['ACTIVE', 'PAST_DUE', 'CANCELED']) {
    await db.subscription.update({ where: { id: subscription.id }, data: { status } });
    const response = await request(first); assert.equal(response.status, 200);
    const state = await response.json();
    assert.equal(state.appAccountToken, initial.appAccountToken);
    assert.equal(state.existingSubscription, status !== 'CANCELED');
    assert.equal(state.purchaseAllowed, false);
    assert.equal(state.stripeSubscriptionStatus, status === 'CANCELED' ? null : status);
  }
  if (ledgerEnabled) {
    const now = new Date(), expiresAt = new Date(now.getTime() + 60000);
    const transactionId = randomUUID();
    await db.appleTransaction.create({ data: { environment: 'Sandbox', transactionId,
      originalTransactionId: transactionId, userId: first.user.id,
      productId: 'fr.coai.mobile.essentiel.monthly',
      purchasedAt: new Date(now.getTime() - 60000), expiresAt, signedAt: now } });
    for (const [change, expected] of [
      [{}, true], [{ expiresAt: new Date(now.getTime() - 1000) }, false],
      [{ expiresAt, revokedAt: now }, false],
    ]) {
      await db.appleTransaction.update({ where: { environment_transactionId: {
        environment: 'Sandbox', transactionId } }, data: change });
      const response = await request(first); assert.equal(response.status, 200);
      const state = await response.json();
      assert.equal(state.appleSubscription, expected);
      assert.equal(state.existingSubscription, expected);
      assert.equal(state.purchaseAllowed, false);
    }
  }
  const before = await db.appleTransaction.count({ where: { userId: first.user.id } });
  const unsigned = await post(transactions, { Authorization: first.bearer }, { signedTransaction: 'unsigned-qa-value' });
  assert.equal(unsigned.status, 503, 'Missing Apple verification config cannot confirm a purchase');
  assert.equal(await db.appleTransaction.count({ where: { userId: first.user.id } }), before);
}
async function run() {
  try { await main(); }
  finally {
    for (const row of fixtures) {
      if (row.auth) await row.auth.auth.signOut({ scope: 'global' });
      if (row.user) {
        await db.user.deleteMany({ where: { id: row.user.id, email: row.email, supabaseAuthId: row.authId } });
        assert.equal(await db.user.count({ where: { id: row.user.id } }), 0);
        assert.equal(await db.appleTransaction.count({ where: { userId: row.user.id } }), 0);
      }
      const removed = await admin.auth.admin.deleteUser(row.authId);
      assert.equal(removed.error, null);
    }
    await db.$disconnect();
  }
  console.log(`PASS: actual local HTTP/Auth/DB Apple flow, concurrent identity, cookie/bearer isolation, Stripe states, unsigned purchase rejected; ledger ${ledgerEnabled ? 'active/expired/refunded checked' : 'disabled'}. Disposable accounts removed; no Apple purchase.`);
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
