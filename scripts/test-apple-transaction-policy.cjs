const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const exportsUnderTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/subscription/apple-transaction-policy.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsUnderTest });
const { evaluateAppleTransaction: evaluate } = exportsUnderTest;
// Fixtures only: these are not approved commercial product identifiers.
const context = { accountToken: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', bundleId: 'test.coai', environment: 'Sandbox', productIDs: ['test.monthly'], now: 1000 };
const transaction = { transactionId: '1', originalTransactionId: '1', appAccountToken: context.accountToken, bundleId: context.bundleId, environment: context.environment, productId: 'test.monthly', type: 'Auto-Renewable Subscription', purchaseDate: 500, signedDate: 600, expiresDate: 2000 };
assert.equal(evaluate(transaction, context).active, true);
for (const patch of [{ expiresDate: 1000 }, { expiresDate: 999 }, { revocationDate: 0 }, { isUpgraded: true }]) {
  assert.equal(evaluate({ ...transaction, ...patch }, context).active, false);
}
for (const patch of [{ appAccountToken: undefined }, { appAccountToken: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }, { bundleId: 'other.app' }, { environment: 'Production' }, { productId: 'other' }, { type: 'Consumable' }, { transactionId: '' }, { originalTransactionId: '' }, { expiresDate: undefined }, { expiresDate: NaN }]) {
  assert.throws(() => evaluate({ ...transaction, ...patch }, context));
}
assert.throws(() => evaluate(transaction, { ...context, productIDs: [] }));
assert.throws(() => evaluate(transaction, { ...context, now: NaN }));
for (const patch of [
  { purchaseDate: undefined }, { signedDate: undefined }, { signedDate: NaN },
  { signedDate: Infinity }, { purchaseDate: -1 }, { expiresDate: 8640000000000001 },
  { expiresDate: 1.5 }, { purchaseDate: 2000 }, { purchaseDate: 2001 },
  { revocationDate: NaN }, { revocationDate: -1 }, { isUpgraded: 'false' },
  { transactionId: ' ' }, { originalTransactionId: ' 1' },
]) assert.throws(() => evaluate({ ...transaction, ...patch }, context));
const facts = evaluate({ ...transaction, revocationDate: 750, isUpgraded: true }, context);
assert.equal(facts.purchasedAt, 500);
assert.equal(facts.signedAt, 600);
assert.equal(facts.expiresAt, 2000);
assert.equal(facts.revokedAt, 750);
assert.equal(facts.upgraded, true);
assert.equal(facts.accountToken, context.accountToken);
assert.equal(facts.productID, 'test.monthly');
assert.equal(facts.environment, 'Sandbox');
assert.equal(evaluate(transaction, { ...context, now: 2001 }).active, false);
console.log('PASS: Apple transaction validation and preserved reconciliation facts; signature verification and persistence NOT tested.');
