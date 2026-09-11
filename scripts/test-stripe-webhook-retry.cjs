// Exercises the real handler, signature verifier and local PostgreSQL writes.
// No live Stripe requests, email provider or production datasource is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
if (!process.argv.includes('--local')) throw Error('Explicit --local is required');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' } } });
const sdk = new Stripe('sk_test_local_signature_only');
const secret = 'whsec_local_retry_fixture_only';
const id = `evt_coai_local_retry_${randomUUID()}`;
const paidId = `${id}_paid`;
const userId = randomUUID();
const email = `webhook-retry-${userId}@example.test`;
const event = { id, object: 'event', type: 'invoice.payment_failed', created: Math.floor(Date.now() / 1000), livemode: false,
  data: { object: { id: `in_${id}`, customer: `cus_${id}`, subscription: `sub_${id}`, amount_due: 1999, currency: 'eur' } } };
let notifications = 0;
let failNotification = true;
let failSubscriptionUpdate = false;
let invoicePaid = false;
const handlerPrisma = new Proxy(prisma, { get(target, key) {
  if (key !== 'subscription') return target[key];
  return new Proxy(target.subscription, { get(delegate, method) {
    if (method !== 'updateMany') return delegate[method];
    return async args => {
      if (failSubscriptionUpdate) throw Error('Simulated subscription write outage');
      return delegate.updateMany(args);
    };
  } });
} });
const deps = {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  '@/lib/stripe/client': { stripe: { webhooks: sdk.webhooks,
    subscriptions: { retrieve: async () => ({ id: `sub_${id}`, customer: `cus_${id}`, status: 'past_due', latest_invoice: `in_${id}` }) },
    invoices: { retrieve: async () => ({ ...event.data.object, status: invoicePaid ? 'paid' : 'open',
      amount_remaining: invoicePaid ? 0 : 1999 }) },
  } },
  '@/lib/db/client': { prisma: handlerPrisma },
  '@/lib/parrainage/reward': { appliquerRecompenseParrainageSiEligible: async () => { throw Error('Unexpected referral side effect'); } },
  '@/lib/email/client': {
    sendAdminNotification: async () => { notifications++; if (failNotification) throw Error('Simulated notification outage'); },
    sendEmail: async to => { assert.equal(to, email); return true; },
  },
  '@/lib/programmes-prets/catalogue': { PROGRAMMES_PRETS: [] },
};
const box = { exports: {}, Date, Map, process: { env: { STRIPE_WEBHOOK_SECRET: secret } }, require: name => {
  assert.ok(name in deps, `Unmocked import ${name}`); return deps[name];
} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/app/api/webhooks/stripe/route.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, box);
const request = (sig, input = event) => {
  const payload = JSON.stringify(input);
  const signature = sig ?? sdk.webhooks.generateTestHeaderString({ payload, secret });
  return { text: async () => payload, headers: { get: () => signature } };
};
async function main() {
  try {
    await prisma.user.create({ data: { id: userId, supabaseAuthId: userId, email } });
    await prisma.subscription.create({ data: { userId, stripeCustomerId: `cus_${id}`, stripeSubscriptionId: `sub_${id}`, status: 'PAST_DUE', plan: 'PASS_IA' } });
    assert.equal((await box.exports.POST(request('invalid'))).status, 400);
    assert.equal(await prisma.stripeWebhookEvent.count({ where: { id } }), 0);
    if (process.argv.includes('--probe-interrupted-reservation')) {
      // Persisted state left when a process stops after reserving the event,
      // before entering its business handler. Do not kill a shared process.
      await prisma.stripeWebhookEvent.create({ data: { id, type: event.type } });
      failNotification = false;
      const resumed = await box.exports.POST(request());
      const ledgerCount = await prisma.billingEvent.count({ where: { id } });
      console.log(JSON.stringify({ probe: 'interrupted-reservation', status: resumed.status,
        duplicate: resumed.body.duplicate === true, ledgerCount, notifications }));
      if (ledgerCount === 0) assert.notEqual(resumed.status, 200,
        'BLOCKER: interrupted reservation acknowledged although processing never ran');
      return;
    }
    await assert.rejects(box.exports.POST(request()), /Simulated notification outage/);
    assert.equal(await prisma.billingEvent.count({ where: { id } }), 1, 'Financial entry survives notification failure');
    assert.equal(await prisma.stripeWebhookEvent.count({ where: { id } }), 0, 'Failed delivery remains retryable');
    failNotification = false;
    const retried = await box.exports.POST(request());
    assert.equal(retried.status, 200, 'Same signed event must recover after partial processing');
    assert.equal(await prisma.billingEvent.count({ where: { id } }), 1);
    assert.equal(await prisma.stripeWebhookEvent.count({ where: { id } }), 1);
    const duplicate = await box.exports.POST(request());
    assert.equal(duplicate.body.duplicate, true);
    assert.equal(notifications, 2, 'Only failed attempt and successful retry; no third notification');
    const record = await prisma.billingEvent.findUnique({ where: { id } });
    assert.equal(record.amountCents, 1999);
    assert.equal(record.kind, 'FAILED');
    const paid = { ...event, id: paidId, type: 'invoice.payment_succeeded', data: { object: { ...event.data.object, amount_paid: 1999 } } };
    invoicePaid = true;
    failSubscriptionUpdate = true;
    await assert.rejects(box.exports.POST(request(undefined, paid)), /Simulated subscription write outage/);
    assert.equal(await prisma.billingEvent.count({ where: { id: paidId } }), 1);
    failSubscriptionUpdate = false;
    assert.equal((await box.exports.POST(request(undefined, paid))).status, 200);
    assert.equal((await box.exports.POST(request(undefined, paid))).body.duplicate, true);
    assert.equal(await prisma.billingEvent.count({ where: { id: paidId } }), 1);
    assert.equal((await prisma.billingEvent.findUnique({ where: { id: paidId } })).kind, 'PAID');
    assert.equal(notifications, 2);
    console.log('PASS real local SQL: signature rejection, notification/DB failures after ledger writes, identical FAILED/PAID event retries, unique financial entries, duplicates acknowledged without effects');
  } finally {
    // Exact random fixture identities created by this run only.
    await prisma.stripeWebhookEvent.deleteMany({ where: { id: { in: [id, paidId] } } });
    await prisma.billingEvent.deleteMany({ where: { id: { in: [id, paidId] } } });
    await prisma.user.deleteMany({ where: { id: userId, email } });
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error.code ?? 'ERROR', error.message); process.exitCode = 1; });
