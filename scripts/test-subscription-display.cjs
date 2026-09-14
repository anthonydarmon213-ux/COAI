const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const loaded = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/subscription/display.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module: loaded, exports: loaded.exports, Intl });
const { subscriptionDisplay: display } = loaded.exports;
const base = { status: 'ACTIVE', plan: 'PASS_IA', billingInterval: 'ANNUAL', amountCents: 11900, currency: 'eur' };
assert.equal(display(null).amount, null);
assert.equal(display(null).name, 'Aucun abonnement');
assert.match(display(base).amount, /119.*€ \/ an/);
assert.match(display({ ...base, amountCents: 999, billingInterval: 'MONTHLY' }).amount, /9,99.*mois/);
assert.match(display({ ...base, billingInterval: 'QUARTERLY' }).amount, /trimestre/);
assert.match(display({ ...base, amountCents: 0 }).amount, /0,00/);
for (const changed of [{ amountCents: null }, { amountCents: -1 }, { currency: 'jpy' }, { status: 'CANCELED' }, { status: 'INCOMPLETE' }, { billingInterval: 'UNKNOWN' }]) {
  assert.equal(display({ ...base, ...changed }).amount, null);
}
assert.equal(display({ ...base, plan: 'PREMIUM', status: 'CANCELED' }).name, 'VIP Présentiel');
assert.match(display({ ...base, status: 'CANCELED' }).description, /résilié/);
const page = fs.readFileSync('src/app/(app)/compte/abonnement/page.tsx', 'utf8');
assert(!page.includes('PLAN_LABELS'));
assert(page.includes('Découvrir Anthony, le fondateur de COAI'));
assert(page.includes('Besoin d’aide avec mon abonnement'));
console.log('Abonnement : montants réels, absence de prix supposé, statuts et aide — OK');
