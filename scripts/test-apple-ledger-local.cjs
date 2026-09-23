// Real local PostgreSQL tests with synthetic verified facts, NOT Apple receipts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const url = new URL(process.env.DATABASE_URL || 'http://missing.invalid');
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '54322');
const db = new PrismaClient();
const out = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/subscription/apple-ledger.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: out, Date });
const save = out.persistVerifiedAppleTransaction;
function loadModule(path, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, Date, require: name => {
    assert(Object.hasOwn(dependencies, name), name); return dependencies[name];
  } });
  return exports;
}
const catalogue = loadModule('src/lib/subscription/apple-catalogue.ts');
const { readEffectiveAccess } = loadModule('src/lib/subscription/read-effective-access.ts', {
  './effective-access': loadModule('src/lib/subscription/effective-access.ts'),
  './apple-catalogue': catalogue,
});
const { deliverAppleTransaction } = loadModule('src/lib/subscription/apple-delivery.ts');
async function main() {
  const before = JSON.stringify(await db.subscription.findMany({ orderBy: { id: 'asc' } }));
  const id = randomUUID();
  const user = await db.user.create({ data: { id, supabaseAuthId: id, email: `apple-ledger-${id}@example.test`, applePurchaseAccount: { create: {} } }, include: { applePurchaseAccount: true } });
  const other = await db.applePurchaseAccount.findFirst({ where: { userId: { not: id } } });
  assert(other);
  const base = { environment: 'Sandbox', transactionID: `qa-${id}`, originalTransactionID: `chain-${id}`,
    accountToken: user.applePurchaseAccount.accountToken, productID: 'test.monthly', purchasedAt: 1000,
    expiresAt: 10000, signedAt: 2000, revokedAt: null, upgraded: false, active: true };
  const accessFacts = { ...base, transactionID: `access-${id}`, originalTransactionID: `access-chain-${id}`,
    productID: catalogue.APPLE_ESSENTIEL_PRODUCT_IDS[0] };
  const read = () => readEffectiveAccess(db, id, 'Sandbox', new Date(3000));
  assert.equal((await read()).subscribed, false);
  const deliver = facts => deliverAppleTransaction({ userId: id, accountToken: facts.accountToken, signedTransaction: 'synthetic-test-only' }, {
    verify: async () => facts, // ONLY cryptographic verification mocked; ledger and rights use PostgreSQL.
    persist: (userId, verified) => save(db, userId, verified),
    readAccess: read,
  });
  const delivered = await deliver(accessFacts);
  assert.equal(delivered.persisted, true); assert.equal(delivered.access.sources.apple, true);
  assert.equal(delivered.access.plan, 'PASS_IA');
  assert.equal((await readEffectiveAccess(db, id, 'Production', new Date(3000))).subscribed, false);
  assert.equal((await readEffectiveAccess(db, id, 'Sandbox', new Date(10000))).subscribed, false);
  await deliver({ ...accessFacts, signedAt: 4000, revokedAt: 3500 });
  assert.equal((await deliver(accessFacts)).access.subscribed, false, 'Durable refund beats old verified receipt');
  await assert.rejects(readEffectiveAccess(db, randomUUID(), 'Sandbox'), /ACCOUNT_NOT_FOUND/);
  const results = await Promise.all(Array.from({length: 12}, () => save(db, id, base)));
  assert.equal(results.length, 12);
  assert.equal(await db.appleTransaction.count({ where: { userId: id } }), 2);
  const revoked = { ...base, signedAt: 4000, revokedAt: 3500, active: false };
  await save(db, id, revoked);
  const stale = await save(db, id, base);
  assert.equal(stale.revokedAt.getTime(), 3500, 'Replay cannot undo revocation');
  await assert.rejects(save(db, id, { ...base, signedAt: 4000 }), /APPLE_SNAPSHOT_CONFLICT/);
  await assert.rejects(save(db, id, { ...base, signedAt: 5000, productID: 'other' }), /APPLE_TRANSACTION_CONFLICT/);
  await assert.rejects(save(db, other.userId, base), /APPLE_ACCOUNT_MISMATCH/);
  await assert.rejects(save(db, other.userId, { ...base, transactionID: `other-${id}`, accountToken: other.accountToken }), /APPLE_CHAIN_ALREADY_BOUND/);
  const renewal = { ...base, transactionID: `renewal-${id}`, purchasedAt: 9000, expiresAt: 20000, signedAt: 9001 };
  await save(db, id, renewal);
  assert.equal(await db.appleTransaction.count({ where: { userId: id } }), 3);
  await save(db, id, { ...revoked, signedAt: 9500 });
  const next = await db.appleTransaction.findUnique({ where: { environment_transactionId: { environment: 'Sandbox', transactionId: renewal.transactionID } } });
  assert.equal(next.revokedAt, null, 'Refund of older transaction must not overwrite renewal');
  // Force both real transactions to read the absent key before either writes.
  // Different chain locks must not allow a shared transaction ID to be stolen.
  let reads = 0, release;
  const barrier = new Promise(resolve => { release = resolve; });
  const concurrentDB = { $transaction: (callback, options) => db.$transaction(tx => callback({
    $queryRaw: tx.$queryRaw.bind(tx), applePurchaseAccount: tx.applePurchaseAccount,
    appleTransaction: {
      findFirst: tx.appleTransaction.findFirst.bind(tx.appleTransaction),
      findUnique: async args => {
        const row = await tx.appleTransaction.findUnique(args);
        if (++reads === 2) release();
        await barrier;
        return row;
      },
      create: tx.appleTransaction.create.bind(tx.appleTransaction),
      update: tx.appleTransaction.update.bind(tx.appleTransaction),
      upsert: tx.appleTransaction.upsert.bind(tx.appleTransaction),
    },
  }), options) };
  const collision = { ...base, transactionID: `collision-${id}`, originalTransactionID: `collision-chain-a-${id}` };
  const rival = { ...collision, originalTransactionID: `collision-chain-b-${id}`, accountToken: other.accountToken, expiresAt: 30000 };
  const attempts = await Promise.allSettled([save(concurrentDB, id, collision), save(concurrentDB, other.userId, rival)]);
  assert.equal(attempts.filter(x => x.status === 'fulfilled').length, 1, 'Only one owner may create the shared transaction ID');
  const winner = attempts[0].status === 'fulfilled' ? collision : rival;
  const stored = await db.appleTransaction.findUnique({ where: { environment_transactionId: { environment: 'Sandbox', transactionId: collision.transactionID } } });
  assert.equal(stored.originalTransactionId, winner.originalTransactionID);
  assert.equal(stored.expiresAt.getTime(), winner.expiresAt);
  const [security] = await db.$queryRaw`SELECT relrowsecurity FROM pg_class WHERE oid='public.apple_transactions'::regclass`;
  assert.equal(security.relrowsecurity, true);
  for (const role of ['anon', 'authenticated']) {
    const [grants] = await db.$queryRaw`SELECT has_table_privilege(${role}, 'public.apple_transactions', 'SELECT,INSERT,UPDATE,DELETE') AS allowed`;
    assert.equal(grants.allowed, false);
  }
  assert.equal(JSON.stringify(await db.subscription.findMany({ orderBy: { id: 'asc' } })), before);
  console.log('PASS: PostgreSQL delivery/access, expiry/environment/refund/replay, missing account, 12 concurrent duplicates, ownership race, independent renewals, RLS/grants, Stripe unchanged. Apple verification mocked.');
}
main().catch(error => { console.error(error.message); process.exitCode=1; }).finally(() => db.$disconnect());
