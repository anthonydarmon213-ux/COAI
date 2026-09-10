// Real signed webhook and local PostgreSQL; Stripe reads/email are simulated.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
if (!process.argv.includes('--local')) throw Error('--local required');
const db = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' } } });
const id = randomUUID(), email = `invoice-order-${id}@example.test`;
const customer = `cus_fixture_${id}`, subId = `sub_fixture_${id}`, invoiceId = `in_fixture_${id}`;
const sdk = new Stripe('sk_test_local_signature_only'), secret = 'whsec_local_invoice_fixture';
const eventIds = [], notices = [];
let outage = false, collision = false, mutateAfterRead = null;
let currentInvoice = { id: invoiceId, customer, subscription: subId, status: 'paid', paid: true,
  amount_due: 1999, amount_paid: 1999, amount_remaining: 0, currency: 'eur' };
let currentSubscription = { id: subId, customer, status: 'active', latest_invoice: invoiceId };
const prisma = new Proxy(db, { get(target, key) {
  if (key !== 'subscription') return target[key];
  return new Proxy(target.subscription, { get(delegate, method) {
    if (method !== 'updateMany') return delegate[method];
    return args => collision ? { count: 0 } : delegate.updateMany(args);
  } });
} });
const deps = {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  '@/lib/db/client': { prisma },
  '@/lib/stripe/client': { stripe: { webhooks: sdk.webhooks,
    subscriptions: { retrieve: async requested => {
      assert.equal(requested, subId); if (outage) throw Error('fixture Stripe unavailable');
      return structuredClone(currentSubscription);
    } },
    invoices: { retrieve: async requested => {
      assert.equal(requested, invoiceId); if (outage) throw Error('fixture Stripe unavailable');
      const copy = structuredClone(currentInvoice);
      if (mutateAfterRead) { const change = mutateAfterRead; mutateAfterRead = null; await change(); }
      return copy;
    } },
  } },
  '@/lib/parrainage/reward': {}, '@/lib/programmes-prets/catalogue': { PROGRAMMES_PRETS: [] },
  '@/lib/email/client': {
    sendAdminNotification: async subject => { notices.push(subject); return true; },
    sendEmail: async (to, subject) => { assert.equal(to, email); notices.push(subject); return true; },
  },
};
const box = { exports: {}, Date, Map, process: { env: { STRIPE_WEBHOOK_SECRET: secret } }, require: key => {
  assert.ok(key in deps, key); return deps[key];
} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/webhooks/stripe/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, box);
function event(type, override = {}) {
  const value = { id: `evt_invoice_${randomUUID()}`, type, created: Math.floor(Date.now()/1000)-3600,
    livemode: false, data: { object: { ...structuredClone(currentInvoice), ...override } } };
  eventIds.push(value.id); return value;
}
function deliver(value) {
  const payload = JSON.stringify(value), signature = sdk.webhooks.generateTestHeaderString({ payload, secret });
  return box.exports.POST({ text: async () => payload, headers: { get: () => signature } });
}
const read = () => db.subscription.findUniqueOrThrow({ where: { userId: id } });
(async () => {
  try {
    await db.user.create({ data: { id, email, supabaseAuthId: id } });
    await db.subscription.create({ data: { userId: id, stripeCustomerId: customer,
      stripeSubscriptionId: subId, plan: 'PASS_IA', status: 'ACTIVE' } });
    await deliver(event('invoice.payment_failed', { paid: false, status: 'open', amount_remaining: 1999 }));
    assert.equal((await read()).paymentFailedAt, null, 'old failure of a now-paid invoice must not reopen incident');
    assert.equal(notices.length, 0);
    console.log('PASS old failure after settlement: no reopened incident or obsolete notification');

    const failure = new Date(Date.now() - 60000);
    await db.subscription.update({ where: { userId: id }, data: { paymentFailedAt: failure } });
    currentSubscription.latest_invoice = `${invoiceId}_new`;
    await deliver(event('invoice.payment_succeeded'));
    assert.equal((await read()).paymentFailedAt.getTime(), failure.getTime(), 'old invoice must not erase new incident');
    console.log('PASS payment for previous invoice preserves newer incident');

    currentSubscription.latest_invoice = invoiceId;
    currentInvoice = { ...currentInvoice, paid: false, status: 'open', amount_remaining: 1999 };
    const failed = event('invoice.payment_failed');
    await deliver(failed);
    assert.equal((await read()).paymentFailedAt.getTime(), failed.created * 1000);
    assert.equal(notices.length, 2);
    assert.equal((await deliver(failed)).body.duplicate, true);
    assert.equal(notices.length, 2);
    currentInvoice = { ...currentInvoice, paid: true, status: 'paid', amount_remaining: 0 };
    await deliver(event('invoice.payment_succeeded'));
    assert.equal((await read()).paymentFailedAt, null);
    console.log('PASS current invoice failure and payment remain actionable, duplicate acknowledged');

    // New API shape in signed payload; SDK retrieve may still use old shape.
    const parentEvent = event('invoice.payment_succeeded', { subscription: undefined,
      parent: { subscription_details: { subscription: subId } } });
    await deliver(parentEvent);
    assert.equal((await db.billingEvent.findUniqueOrThrow({ where: { id: parentEvent.id } })).stripeSubscriptionId, subId);

    outage = true;
    const retry = event('invoice.payment_failed');
    await assert.rejects(deliver(retry), /fixture Stripe unavailable/);
    assert.equal(await db.stripeWebhookEvent.count({ where: { id: retry.id } }), 0);
    assert.equal(await db.billingEvent.count({ where: { id: retry.id } }), 1);
    outage = false; await deliver(retry);
    assert.equal((await read()).paymentFailedAt, null);
    console.log('PASS provider outage retryable after ledger write; new invoice payload shape supported');

    currentInvoice = { ...currentInvoice, paid: false, status: 'open', amount_remaining: 1999 };
    const before = notices.length;
    mutateAfterRead = async () => {
      currentInvoice = { ...currentInvoice, paid: true, status: 'paid', amount_remaining: 0 };
      await db.subscription.update({ where: { userId: id }, data: { updatedAt: new Date(Date.now()+1000), paymentFailedAt: null } });
    };
    await deliver(event('invoice.payment_failed'));
    assert.equal((await read()).paymentFailedAt, null);
    assert.equal(notices.length, before);
    collision = true;
    const busy = event('invoice.payment_succeeded');
    await assert.rejects(deliver(busy), /concurrent/i);
    assert.equal(await db.stripeWebhookEvent.count({ where: { id: busy.id } }), 0);
    collision = false;
    console.log('PASS concurrent local write forces fresh Stripe read; persistent contention stays retryable');

    await db.subscription.update({ where: { userId: id }, data: { stripeSubscriptionId: `${subId}_new`, paymentFailedAt: failure } });
    await deliver(event('invoice.payment_succeeded'));
    assert.equal((await read()).paymentFailedAt.getTime(), failure.getTime());
    assert.equal(notices.length, before);
    await deliver(event('invoice.payment_failed', { subscription: null }));
    assert.equal((await read()).paymentFailedAt.getTime(), failure.getTime(), 'standalone invoice must not affect a subscription');
    assert.equal(notices.length, before);
    assert.equal(await db.billingEvent.count({ where: { id: { in: eventIds } } }), eventIds.length);
    console.log('PASS previous subscription cannot mutate replacement; historical ledger retained');
    console.log('LIMIT: provider simulated; no real payment/delivery, distributed webhook reservations not covered.');
  } finally {
    await db.stripeWebhookEvent.deleteMany({ where: { id: { in: eventIds } } });
    await db.billingEvent.deleteMany({ where: { id: { in: eventIds } } });
    await db.user.deleteMany({ where: { id, email } });
    await db.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
