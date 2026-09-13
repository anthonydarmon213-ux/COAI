// Actual handler; auth, database and Stripe are simulated. No network/payment.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let calls = [], reads = 0, writes = 0, authenticated = true;
const deps = {
  'next/server': { NextResponse: { json: (body, opts) => ({ body, status: opts?.status ?? 200 }) } },
  '@/lib/pricing/offre-rentree': { prixTrimestreCentimes: () => 3900 },
  '@/lib/auth/server': { getCurrentUser: async () => authenticated ? { id: 'fixture', email: 'checkout@example.test' } : null },
  '@/lib/stripe/client': { stripe: { checkout: { sessions: { create: async p => {
    calls.push(p); return { url: 'https://example.test/checkout' };
  } } } } },
  '@/lib/db/client': { prisma: { user: {
    findUnique: async () => { reads++; return { id: 'fixture', subscription: null }; },
    update: async () => { writes++; },
  } } },
};
const box = { exports: {}, Date, process: { env: { NEXT_PUBLIC_APP_URL: 'https://example.test' } },
  require: name => { assert(name in deps, name); return deps[name]; } };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/stripe/checkout/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, box);
const request = body => ({ json: async () => body });
(async () => {
  const invalid = [null, 0, false, 'PASS_IA', [], {}, { plan: 'UNKNOWN', billing: 'MONTHLY' },
    { plan: 'PASS_IA' }, { plan: 'PASS_IA', billing: 'UNKNOWN' },
    { plan: 'PASS_IA', billing: null }, { plan: 'PREMIUM' }, { plan: 'STANDARD' }];
  for (const body of invalid) assert.equal((await box.exports.POST(request(body))).status, 400);
  assert.equal((await box.exports.POST({ json: async () => { throw Error('invalid JSON'); } })).status, 400);
  assert.equal(calls.length, 0); assert.equal(reads, 0); assert.equal(writes, 0);
  for (const [billing, amount, interval, count] of [
    ['MONTHLY', 1999, 'month', 1], ['QUARTERLY', 3900, 'month', 3], ['ANNUAL', 11900, 'year', 1],
  ]) {
    assert.equal((await box.exports.POST(request({ plan: 'PASS_IA', billing, vipSessions: 1 }))).status, 200);
    const config = calls.at(-1), price = config.line_items[0].price_data;
    assert.equal(price.unit_amount, amount); assert.equal(price.currency, 'eur');
    assert.equal(price.recurring.interval, interval); assert.equal(price.recurring.interval_count, count);
    assert.equal(config.subscription_data.trial_period_days, 7);
    assert(config.cancel_url.includes(`billing=${billing}`));
  }
  authenticated = false;
  assert.equal((await box.exports.POST(request({ plan: 'PASS_IA', billing: 'ANNUAL' }))).status, 401);
  assert.equal(calls.length, 3); assert.equal(writes, 3);
  console.log('PASS: 13 invalid requests refused before DB/Stripe; 3 explicit billing choices preserved; anonymous refused. No network.');
})().catch(error => { console.error(error); process.exitCode = 1; });
