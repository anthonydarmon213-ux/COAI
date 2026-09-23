// Local PostgreSQL only. Synthetic receipt facts; no real Apple purchase/Auth deletion.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const url = new URL(process.env.DATABASE_URL || 'http://missing.invalid');
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.port, '54322');
const db = new PrismaClient();
function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, Date, require: name => {
    assert(Object.hasOwn(dependencies, name), name); return dependencies[name];
  } });
  return exports;
}
const { persistVerifiedAppleTransaction: save } = load('src/lib/subscription/apple-ledger.ts');
const { getOrCreateAppleAccountToken: tokenFor } = load('src/lib/subscription/apple-account.ts', {
  '@/lib/db/client': { prisma: db },
});
const { receiveAppleNotification: notify } = load('src/lib/subscription/apple-notification.ts', {
  './apple-signed-transaction': {},
  './apple-transaction-policy': load('src/lib/subscription/apple-transaction-policy.ts'),
});
const { readEffectiveAccess: access } = load('src/lib/subscription/read-effective-access.ts', {
  './effective-access': load('src/lib/subscription/effective-access.ts'),
  './apple-catalogue': load('src/lib/subscription/apple-catalogue.ts'),
});
async function main() {
  const id = randomUUID(), authID = randomUUID(), email = `apple-delete-${id}@example.test`;
  const user = await db.user.create({ data: { id, supabaseAuthId: authID, email } });
  const token = await tokenFor(user.id, db);
  const facts = { environment: 'Sandbox', transactionID: `delete-${id}`, originalTransactionID: `chain-${id}`,
    accountToken: token, productID: 'fr.coai.mobile.essentiel.monthly', purchasedAt: 1000,
    expiresAt: 10000, signedAt: 2000, revokedAt: null, upgraded: false, active: true };
  await save(db, id, facts);
  assert.equal((await access(db, id, 'Sandbox', new Date(3000))).sources.apple, true);
  // Delete ONLY the exact synthetic user created above; exercise real cascades.
  await db.user.delete({ where: { id } });
  assert.equal(await db.applePurchaseAccount.count({ where: { userId: id } }), 0);
  assert.equal(await db.appleTransaction.count({ where: { userId: id } }), 0);
  await assert.rejects(access(db, id, 'Sandbox'), /ACCOUNT_NOT_FOUND/);
  await assert.rejects(save(db, id, facts), /APPLE_ACCOUNT_MISMATCH/);
  await assert.rejects(tokenFor(id, db)); // FK prevents recreation without a user.
  await assert.rejects(notify('synthetic-only', {
    verify: async () => ({ notificationID: randomUUID(), facts }),
    findOwner: async accountToken => (await db.applePurchaseAccount.findUnique({ where: { accountToken } }))?.userId ?? null,
    persist: (userID, receipt) => save(db, userID, receipt),
  }), /ACCOUNT_NOT_FOUND/);

  // Even an application profile recreated with the same Auth ID/email gets a
  // fresh purchase token. An old receipt must not silently reconnect it.
  const replacement = await db.user.create({ data: { supabaseAuthId: authID, email } });
  const replacementToken = await tokenFor(replacement.id, db);
  assert.notEqual(replacementToken, token);
  await assert.rejects(save(db, replacement.id, facts), /APPLE_ACCOUNT_MISMATCH/);
  assert.equal((await access(db, replacement.id, 'Sandbox', new Date(3000))).subscribed, false);

  // Deterministic in-flight write: deletion after the ledger's ownership check,
  // but before its insert. The database FK must prevent resurrection.
  let releaseInsert, reachedInsert;
  const gate = new Promise(resolve => { releaseInsert = resolve; });
  const reached = new Promise(resolve => { reachedInsert = resolve; });
  const delayed = { $transaction: (callback, options) => db.$transaction(tx => callback({
    $queryRaw: tx.$queryRaw.bind(tx), applePurchaseAccount: tx.applePurchaseAccount,
    appleTransaction: {
      findFirst: tx.appleTransaction.findFirst.bind(tx.appleTransaction),
      findUnique: tx.appleTransaction.findUnique.bind(tx.appleTransaction),
      update: tx.appleTransaction.update.bind(tx.appleTransaction),
      create: async args => { reachedInsert(); await gate; return tx.appleTransaction.create(args); },
    },
  }), options) };
  const pending = save(delayed, replacement.id, { ...facts, accountToken: replacementToken });
  const rejected = assert.rejects(pending);
  await reached;
  try { await db.user.delete({ where: { id: replacement.id } }); }
  finally { releaseInsert(); }
  await rejected;
  assert.equal(await db.applePurchaseAccount.count({ where: { userId: replacement.id } }), 0);
  assert.equal(await db.appleTransaction.count({ where: { userId: replacement.id } }), 0);
  console.log('PASS: real local PostgreSQL deletion cascades, stale receipt/notification rejection, recreated account isolation, concurrent write cannot resurrect access. Synthetic rows removed; real Apple/Auth not tested.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
