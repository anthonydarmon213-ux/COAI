// Real handlers and PostgreSQL; signed fixture events, no provider calls.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const ts = require('typescript'), Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
if (!process.argv.includes('--local')) throw Error('--local required');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' } } });
const id = randomUUID(), customer = `cus_${id}`, events = [], secret = 'whsec_order_fixture';
const sdk = new Stripe('sk_test_fixture');
let notices = 0, unavailable = false;
const fixture = (suffix, created, status = 'active') => ({ id: `sub_${id}_${suffix}`, customer, created, status,
  metadata: { plan: 'PASS_IA' }, cancel_at_period_end: false, trial_end: null,
  items: { data: [{ price: { id: 'price_fixture', unit_amount: 11900, currency: 'eur', recurring: { interval: 'year' } } }] } });
const old = fixture('old', 100, 'canceled'), recent = fixture('recent', 200), newest = fixture('newest', 300);
const sources = new Map([old, recent, newest].map(sub => [sub.id, sub]));
const deps = {
  'node:crypto': { randomUUID },
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  '@/lib/db/client': { prisma },
  '@/lib/auth/server': { getCurrentUser: async () => ({ id }) },
  '@/lib/stripe/client': { stripe: { webhooks: sdk.webhooks, subscriptions: { retrieve: async key => {
    if (unavailable) throw Error('provider unavailable');
    assert.ok(sources.has(key)); return structuredClone(sources.get(key));
  } }, checkout: { sessions: { retrieve: async () => ({ status: 'complete', mode: 'subscription', client_reference_id: id, subscription: old }) } } } },
  '@/lib/parrainage/reward': { appliquerRecompenseParrainageSiEligible: async () => {} },
  '@/lib/email/client': { sendAdminNotification: async () => { notices++; }, sendEmail: async () => { notices++; } },
  '@/lib/programmes-prets/catalogue': { PROGRAMMES_PRETS: [] },
};
function load(file) {
  const box = { exports: {}, Date, Map, process: { env: { STRIPE_WEBHOOK_SECRET: secret } }, require: name => {
    assert.ok(name in deps, name); return deps[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, box);
  return box.exports;
}
const sync = load('src/lib/stripe/subscription-sync.ts');
deps['@/lib/stripe/subscription-sync'] = sync;
const confirm = load('src/app/api/stripe/confirm-session/route.ts');
const webhook = load('src/app/api/webhooks/stripe/route.ts');
const state = () => prisma.subscription.findUniqueOrThrow({ where: { userId: id } });
async function deliver(sub) {
  const event = { id: `evt_${randomUUID()}`, type: 'checkout.session.completed', data: { object: {
    id: 'cs_fixture', mode: 'subscription', client_reference_id: id, subscription: sub.id,
  } } };
  events.push(event.id);
  const payload = JSON.stringify(event), signature = sdk.webhooks.generateTestHeaderString({ payload, secret });
  return webhook.POST({ text: async () => payload, headers: { get: () => signature } });
}
(async () => {
  try {
    await prisma.user.create({ data: { id, supabaseAuthId: id, email: `order-${id}@example.test` } });
    await Promise.all([sync.upsertStripeSubscription(recent, id), sync.upsertStripeSubscription(recent, id)]);
    assert.equal(await prisma.subscription.count({ where: { userId: id } }), 1);
    assert.equal((await confirm.POST({ json: async () => ({ sessionId: 'cs_old' }) })).status, 409);
    assert.equal((await state()).stripeSubscriptionId, recent.id);
    assert.equal((await deliver(old)).status, 200);
    assert.equal(notices, 0);
    assert.equal((await state()).status, 'ACTIVE');
    console.log('PASS concurrent first confirmation, old return rejected, old completed webhook ignored without notification');
    recent.status = 'canceled';
    await sync.upsertStripeSubscription(recent, id);
    await deliver(newest);
    assert.equal((await state()).stripeSubscriptionId, newest.id);
    assert.equal((await state()).status, 'ACTIVE');
    const before = notices;
    await Promise.all([sync.upsertStripeSubscription(old, id), deliver(recent), sync.upsertStripeSubscription(newest, id)]);
    assert.equal((await state()).stripeSubscriptionId, newest.id);
    assert.equal((await state()).status, 'ACTIVE');
    assert.equal(notices, before);
    console.log('PASS legitimate resubscription and concurrent old/new confirmations preserve latest subscription');
    const tied = fixture('tied', 300);
    await assert.rejects(sync.upsertStripeSubscription(tied, id), /order safely/);
    unavailable = true;
    await assert.rejects(sync.upsertStripeSubscription(old, id), /provider unavailable/);
    assert.equal((await state()).stripeSubscriptionId, newest.id);
    console.log('PASS ambiguous creation time and provider failure cause no write; LIMIT: no production transaction tested');
    unavailable = false;
    await prisma.subscription.delete({ where: { userId: id } });
    await Promise.all([sync.upsertStripeSubscription(old, id), sync.upsertStripeSubscription(newest, id)]);
    assert.equal((await state()).stripeSubscriptionId, newest.id);
    assert.equal((await state()).status, 'ACTIVE');
    console.log('PASS different first confirmations racing into an empty row converge to newest');
  } finally {
    await prisma.stripeWebhookEvent.deleteMany({ where: { id: { in: events } } });
    await prisma.user.deleteMany({ where: { id, email: `order-${id}@example.test` } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
