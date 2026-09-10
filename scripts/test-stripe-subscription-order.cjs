// Signed events -> actual handler -> local PostgreSQL. Stripe reads and
// notifications simulated; no real account, payment or email is touched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
if (!process.argv.includes('--local')) throw Error('--local required');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' } } });
const sdk = new Stripe('sk_test_signature_fixture');
const secret = 'whsec_local_order_fixture';
const id = randomUUID(), email = `stripe-order-${id}@example.test`;
const customer = `cus_fixture_${id}`, subscriptionId = `sub_fixture_${id}`;
const events = [];
const notifications = [];
let unavailable = false;
let current = {
  id: subscriptionId, customer, status: 'active', metadata: { plan: 'PASS_IA' },
  cancel_at_period_end: false, trial_end: null, current_period_end: 2000000000,
  items: { data: [{ price: { id: 'price_fixture', unit_amount: 11900, currency: 'eur', recurring: { interval: 'year', interval_count: 1 } } }] },
};
const deps = {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  '@/lib/stripe/client': { stripe: { webhooks: sdk.webhooks, subscriptions: {
    retrieve: async requested => {
      assert.equal(requested, subscriptionId);
      if (unavailable) throw Error('fixture Stripe unavailable');
      return structuredClone(current);
    },
  } } },
  '@/lib/db/client': { prisma },
  '@/lib/parrainage/reward': { appliquerRecompenseParrainageSiEligible: async () => {} },
  '@/lib/email/client': {
    sendAdminNotification: async subject => { notifications.push(subject); return true; },
    sendEmail: async (to, subject) => { assert.equal(to, email); notifications.push(subject); return true; },
  },
  '@/lib/programmes-prets/catalogue': { PROGRAMMES_PRETS: [] },
};
const box = { exports: {}, Date, Map, process: { env: { STRIPE_WEBHOOK_SECRET: secret } }, require: name => {
  assert.ok(name in deps, name); return deps[name];
} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/webhooks/stripe/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, box);
function makeEvent(type, status, previous = {}) {
  const event = { id: `evt_order_${randomUUID()}`, type, object: 'event', livemode: false,
    created: Math.floor(Date.now() / 1000) - 3600,
    data: { object: { ...structuredClone(current), ...status }, previous_attributes: previous } };
  events.push(event.id); return event;
}
async function deliver(event) {
  const payload = JSON.stringify(event);
  const signature = sdk.webhooks.generateTestHeaderString({ payload, secret });
  return box.exports.POST({ text: async () => payload, headers: { get: () => signature } });
}
const local = () => prisma.subscription.findUniqueOrThrow({ where: { userId: id } });
(async () => {
  try {
    await prisma.user.create({ data: { id, supabaseAuthId: id, email } });
    await prisma.subscription.create({ data: { userId: id, stripeCustomerId: customer,
      stripeSubscriptionId: subscriptionId, status: 'ACTIVE', plan: 'PASS_IA' } });
    current.status = 'canceled';
    await deliver(makeEvent('customer.subscription.deleted', { status: 'canceled' }));
    assert.equal((await local()).status, 'CANCELED');
    await deliver(makeEvent('customer.subscription.updated', { status: 'active' }, { status: 'trialing' }));
    assert.equal((await local()).status, 'CANCELED', 'late active snapshot must not reactivate a canceled subscription');
    current.cancel_at_period_end = true;
    const endedNoticeCount = notifications.length;
    await deliver(makeEvent('customer.subscription.updated', { status: 'active' }, { cancel_at_period_end: false }));
    assert.equal(notifications.length, endedNoticeCount, 'ended subscription must not announce future access');
    console.log('PASS deleted then late updated: current canceled status preserved');

    current.status = 'active'; current.cancel_at_period_end = false;
    const before = notifications.length;
    await deliver(makeEvent('customer.subscription.updated', { cancel_at_period_end: true }, { cancel_at_period_end: false }));
    assert.equal((await local()).cancelAtPeriodEnd, false);
    assert.equal(notifications.length, before, 'obsolete cancellation must not notify');
    assert.equal((await local()).billingInterval, 'ANNUAL');
    console.log('PASS withdrawn cancellation: fresh interval and status, no obsolete notification');

    current.cancel_at_period_end = true;
    await deliver(makeEvent('customer.subscription.updated', { cancel_at_period_end: true }, { cancel_at_period_end: false }));
    assert.equal((await local()).cancelAtPeriodEnd, true);
    assert.equal(notifications.length, before + 2, 'actual scheduled cancellation still notifies coach and customer');
    current.cancel_at_period_end = false;

    unavailable = true;
    const retry = makeEvent('customer.subscription.updated', { status: 'past_due' });
    await assert.rejects(deliver(retry), /fixture Stripe unavailable/);
    assert.equal((await local()).status, 'ACTIVE');
    assert.equal(await prisma.stripeWebhookEvent.count({ where: { id: retry.id } }), 0);
    unavailable = false; current.status = 'past_due';
    assert.equal((await deliver(retry)).status, 200);
    assert.equal((await local()).status, 'PAST_DUE');
    assert.equal((await deliver(retry)).body.duplicate, true);
    console.log('PASS provider read failure leaves state unchanged and signed event retryable');

    await prisma.subscription.update({ where: { userId: id }, data: {
      stripeSubscriptionId: `${subscriptionId}_replacement`, status: 'ACTIVE', cancelAtPeriodEnd: false,
    } });
    current.status = 'canceled';
    const prior = notifications.length;
    await deliver(makeEvent('customer.subscription.deleted', { status: 'canceled' }));
    await deliver(makeEvent('customer.subscription.updated', { status: 'past_due' }));
    assert.equal((await local()).stripeSubscriptionId, `${subscriptionId}_replacement`);
    assert.equal((await local()).status, 'ACTIVE');
    assert.equal(notifications.length, prior);
    console.log('PASS previous subscription events cannot overwrite or announce cancellation of its replacement');
    console.log('LIMIT: Stripe source simulated; simultaneous source changes and invoice ordering are separate cases.');
  } finally {
    await prisma.stripeWebhookEvent.deleteMany({ where: { id: { in: events } } });
    await prisma.user.deleteMany({ where: { id, email } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
