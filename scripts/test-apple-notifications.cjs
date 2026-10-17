const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
function load(path, deps) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, Buffer, require: name => { assert(Object.hasOwn(deps, name), name); return deps[name]; } });
  return exports;
}
const token = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const config = { environment: 'Sandbox', bundleId: 'fr.coai.mobile', productIDs: ['monthly'] };
const transaction = { transactionId: '1', originalTransactionId: '1', appAccountToken: token,
  bundleId: config.bundleId, environment: 'Sandbox', productId: 'monthly', type: 'Auto-Renewable Subscription',
  purchaseDate: 1000, expiresDate: 5000, signedDate: 2000 };
const event = { version: '2.0', notificationUUID: token, notificationType: 'DID_RENEW', data: { signedTransactionInfo: 'inner' } };
const policy = load('src/lib/subscription/apple-transaction-policy.ts', {});
let outer = event, inner = transaction, failOuter = false, failInner = false;
const calls = [];
const moduleUnderTest = load('src/lib/subscription/apple-notification.ts', {
  './apple-transaction-policy': policy,
  './apple-signed-transaction': { createAppleSignedDataVerifier: received => {
    assert.equal(received, config);
    return {
      verifyAndDecodeNotification: async value => { calls.push('outer'); assert.equal(value, 'outer'); if (failOuter) throw Error('signature'); return outer; },
      verifyAndDecodeTransaction: async value => { calls.push('inner'); assert.equal(value, 'inner'); if (failInner) throw Error('signature'); return inner; },
    };
  } },
});
const verify = moduleUnderTest.createAppleNotificationVerifier(config);
async function route(options = {}) {
  const routeCalls = [];
  const dependencies = {
    'next/server': { NextResponse },
    '@/lib/db/client': { prisma: { applePurchaseAccount: { findUnique: async query => {
      routeCalls.push('owner'); assert.equal(query.where.accountToken, token);
      return options.missingOwner ? null : { userId: 'verified-owner' };
    } } } },
    '@/lib/subscription/apple-server-config': { appleNotificationServerVerifier: () => async payload => {
      routeCalls.push('verify'); assert.equal(payload, 'outer');
      if (options.invalidSignature) throw Error('SECRET');
      return { notificationID: token, facts: options.test ? null : { accountToken: token } };
    } },
    '@/lib/subscription/apple-notification': moduleUnderTest,
    '@/lib/subscription/apple-ledger': { persistVerifiedAppleTransaction: async (_, id) => {
      assert.equal(id, 'verified-owner'); routeCalls.push('persist'); if (options.storageFailure) throw Error('SECRET');
    } },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/webhooks/apple/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, Buffer, process: { env: { APPLE_NOTIFICATIONS_ENABLED: options.disabled ? 'false' : 'true' } }, require: name => dependencies[name] });
  const response = await exports.POST(new Request('https://coai.test/api/webhooks/apple', {
    method: 'POST', headers: { 'content-type': options.badType ? 'text/plain' : 'application/json' },
    body: options.body ?? JSON.stringify({ signedPayload: 'outer', userId: 'attacker', accountToken: 'attacker', environment: 'Production' }),
  }));
  assert.equal(response.status, options.status ?? 200);
  const text = await response.text(); assert(!text.includes('SECRET')); assert(!text.includes('attacker'));
  assert.match(response.headers.get('cache-control'), /no-store/);
  if (response.status !== 200) assert(!text.includes('received'));
  return routeCalls;
}
async function main() {
  const result = await verify('outer', 3000);
  assert.equal(result.facts.accountToken, token); assert.equal(result.facts.active, true);
  assert.deepEqual(calls, ['outer', 'inner']);
  failOuter = true; calls.length = 0;
  await assert.rejects(() => verify('outer')); assert.deepEqual(calls, ['outer']); failOuter = false;
  failInner = true; await assert.rejects(() => verify('outer')); failInner = false;
  for (const patch of [{ environment: 'Production' }, { bundleId: 'evil' }, { appAccountToken: 'bad' }, { productId: 'other' }]) {
    inner = { ...transaction, ...patch }; await assert.rejects(() => verify('outer'));
  }
  inner = transaction;
  outer = { ...event, notificationType: 'REFUND' }; await assert.rejects(() => verify('outer'));
  inner = { ...transaction, revocationDate: 2500 }; assert.equal((await verify('outer', 3000)).facts.active, false);
  inner = transaction;
  for (const patch of [{ version: '1' }, { notificationUUID: '' }, { notificationType: 'CONSUMPTION_REQUEST' }, { data: {} }]) {
    outer = { ...event, ...patch }; await assert.rejects(() => verify('outer'));
  }
  outer = { ...event, notificationType: 'TEST' }; calls.length = 0;
  assert.equal((await verify('outer')).facts, null); assert.deepEqual(calls, ['outer']);
  assert.deepEqual(await route(), ['verify', 'owner', 'persist']);
  assert.deepEqual(await route({ test: true }), ['verify']);
  assert.deepEqual(await route({ invalidSignature: true, status: 503 }), ['verify']);
  assert.deepEqual(await route({ missingOwner: true, status: 503 }), ['verify', 'owner']);
  await route({ storageFailure: true, status: 503 });
  assert.deepEqual(await route({ disabled: true, status: 503 }), []);
  assert.deepEqual(await route({ badType: true, status: 415 }), []);
  for (const body of ['{', 'null', '{}', '{"signedPayload":1}', '{"signedPayload":""}']) {
    assert.deepEqual(await route({ body, status: 400 }), []);
  }
  await route({ body: 'x'.repeat(140001), status: 413 });
  console.log('PASS: notification ordering, nested signature boundary, product/account policy, renewal/refund/test, safe route gating/body/errors. Crypto and route DB mocked.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
