const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
const code = ts.transpileModule(fs.readFileSync('src/app/api/ios/apple/transactions/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
async function run(options = {}) {
  const exports = {}, calls = [];
  const db = { user: { findUnique: async query => {
    assert.equal(query.where.supabaseAuthId, 'auth-user');
    return options.noAccount ? null : { id: 'server-user', applePurchaseAccount: { accountToken: 'server-token' } };
  } } };
  const modules = {
    'next/server': { NextResponse },
    '@/lib/auth/server': { getCurrentUser: async () => { calls.push('auth'); return options.anonymous ? null : { id: 'auth-user' }; } },
    '@/lib/db/client': { prisma: db },
    '@/lib/subscription/apple-server-config': { appleServerVerifier: () => {
      if (options.unconfigured) throw Error('PRIVATE_DETAIL');
      return { environment: 'Sandbox', verify: async () => ({}) };
    } },
    '@/lib/subscription/apple-delivery': { deliverAppleTransaction: async (input, deps) => {
      calls.push('deliver');
      assert.equal(input.userId, 'server-user'); assert.equal(input.accountToken, 'server-token');
      assert.equal(input.signedTransaction, 'jws');
      if (options.failedDelivery) throw Error('PRIVATE_DETAIL');
      await deps.persist('server-user', {}); await deps.readAccess('server-user');
      return { persisted: true, transactionID: 'verified-id' };
    } },
    '@/lib/subscription/apple-ledger': { persistVerifiedAppleTransaction: async (database, id) => {
      assert.equal(database, db); assert.equal(id, 'server-user'); calls.push('persist');
    } },
    '@/lib/subscription/read-effective-access': { readEffectiveAccess: async (database, id, env) => {
      assert.equal(database, db); assert.equal(id, 'server-user'); assert.equal(env, 'Sandbox'); calls.push('access');
    } },
  };
  vm.runInNewContext(code, { exports, Buffer, URL, process: { env: { NEXT_PUBLIC_APP_URL: options.appURL ?? 'https://coai.test' } }, require: name => { assert(Object.hasOwn(modules, name), name); return modules[name]; } });
  const response = await exports.POST(new Request('https://coai.test/api/ios/apple/transactions', {
    method: 'POST', headers: { ...(options.cookieOnly ? {} : { authorization: options.noBearer ? '' : 'Bearer test' }), ...(options.origin ? { origin: options.origin } : {}), 'content-type': options.badType ? 'text/plain' : 'application/json' },
    body: options.body ?? JSON.stringify({ signedTransaction: 'jws', userId: 'attacker', accountToken: 'attacker', environment: 'Production', plan: 'PREMIUM' }),
  }));
  assert.equal(response.status, options.status ?? 200);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  const text = await response.text(); assert(!text.includes('PRIVATE_DETAIL')); assert(!text.includes('attacker'));
  if (response.status !== 200) assert(!text.includes('persisted'));
  return calls;
}
async function main() {
  assert.deepEqual(await run(), ['auth', 'deliver', 'persist', 'access']);
  assert.deepEqual(await run({ noBearer: true, status: 401 }), []);
  assert.deepEqual(await run({ cookieOnly: true, origin: 'https://coai.test' }), ['auth', 'deliver', 'persist', 'access']);
  for (const origin of [undefined, 'null', 'https://attacker.test', 'https://coai.test.attacker.test']) {
    assert.deepEqual(await run({ cookieOnly: true, origin, status: 403 }), []);
  }
  await run({ cookieOnly: true, origin: 'https://coai.test', anonymous: true, status: 401 });
  await run({ cookieOnly: true, appURL: 'http://coai.test', status: 503 });
  assert.deepEqual(await run({ badType: true, status: 415 }), []);
  await run({ anonymous: true, status: 401 });
  await run({ unconfigured: true, status: 503 });
  await run({ noAccount: true, status: 409 });
  await run({ failedDelivery: true, status: 503 });
  for (const body of ['null', '{}', '{', '{"signedTransaction":42}', '{"signedTransaction":""}']) {
    assert.deepEqual(await run({ body, status: 400 }), ['auth']);
  }
  await run({ body: JSON.stringify({ signedTransaction: 'x'.repeat(65537) }), status: 400 });
  assert.deepEqual(await run({ body: 'x'.repeat(70001), status: 413 }), ['auth']);
  console.log('PASS: transaction route authorization, server-owned identity/config, bounded input, delivery wiring and safe failures. Dependencies mocked; not an Apple purchase.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
