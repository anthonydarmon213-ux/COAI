const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const out = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/subscription/effective-access.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: out });
const resolve = out.resolveEffectiveAccess;
const record = { userId: 'a', environment: 'Production', productId: 'monthly', purchasedAt: new Date(500), expiresAt: new Date(2000), revokedAt: null, upgraded: false };
const context = { userId: 'a', stripe: null, apple: [], appleEnvironment: 'Production', appleProductIDs: ['monthly'], programmeUnlockedAt: null, now: new Date(1000) };
assert.equal(resolve(context).subscribed, false);
assert.equal(resolve({ ...context, apple: [record] }).subscribed, true);
for (const patch of [
  { userId: 'b' }, { environment: 'Sandbox' }, { productId: 'unapproved' },
  { expiresAt: new Date(1000) }, { expiresAt: new Date(999) },
  { revokedAt: new Date(0) }, { upgraded: true }, { purchasedAt: new Date(1001) },
  { purchasedAt: new Date(NaN) }, { expiresAt: new Date(NaN) },
]) assert.equal(resolve({ ...context, apple: [{ ...record, ...patch }] }).subscribed, false);
for (const plan of ['PASS_IA', 'STANDARD', 'PREMIUM']) {
  const result = resolve({ ...context, stripe: { status: 'ACTIVE', plan }, apple: [record] });
  assert.equal(result.plan, plan); assert.equal(result.subscribed, true);
}
for (const status of ['CANCELED', 'PAST_DUE', 'INCOMPLETE']) {
  assert.equal(resolve({ ...context, stripe: { status, plan: 'PREMIUM' } }).subscribed, false);
  assert.equal(resolve({ ...context, stripe: { status, plan: 'PREMIUM' }, apple: [record] }).plan, 'PASS_IA');
}
const historical = resolve({ ...context, programmeUnlockedAt: new Date(100) });
assert.equal(historical.programme, true); assert.equal(historical.catalogue, false); assert.equal(historical.suivi, false);
assert.equal(resolve({ ...context, apple: [{ ...record, revokedAt: new Date(800) }, record] }).subscribed, true);
assert.throws(() => resolve({ ...context, now: new Date(NaN) }));
assert.throws(() => resolve({ ...context, userId: '' }));
console.log('PASS: provider-neutral access policy; expired/revoked/cross-account/sandbox denied; Stripe and historical access preserved. Not yet wired to routes.');
