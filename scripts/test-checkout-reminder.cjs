// Real cron, consent queries, Prisma rows and PostgreSQL delivery registry.
// Only the email provider is simulated. Loopback fixtures only, no Stripe call.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
const clients = [0, 1].map(() => new PrismaClient({ datasources: { db: {
  url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
} } }));
const fixtures = [];
const keys = new Map();
function load(file, imports, extra = '', env = { RESEND_API_KEY: 'fake-not-used' }) {
  const box = { exports: {}, Date, Set, process: { env }, require: name => {
    assert.ok(name in imports, name); return imports[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8') + extra,
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, box);
  return box.exports;
}
const registry = load('src/lib/email/delivery-registry.ts', {});
function runner(db, state) {
  const prisma = { ...db, user: { ...db.user,
    findMany: async query => {
      // Restrict actual candidate SQL to this test's exact identity. Keep a stale
      // snapshot across retries, as overlapping cron runs may legitimately do.
      if (!state.snapshot) state.snapshot = await db.user.findMany({ ...query,
        where: { AND: [query.where, { id: state.id }] } });
      if (state.beforeFresh) {
        const effect = state.beforeFresh; state.beforeFresh = null;
        state.freshChange = effect();
      }
      await state.freshChange;
      return state.snapshot;
    },
    updateMany: async query => {
      if (state.markerFailure) throw Error('fixture marker failure');
      return db.user.updateMany(query);
    },
  } };
  const suppression = load('src/lib/email/diagnostic-suppression.ts', {
    '@/lib/db/client': { prisma }, './diagnostic-cadence': {},
  });
  const email = { sendEmail: async (to, subject, text) => {
    state.sends++;
    assert.equal(to, state.email);
    assert.ok(text.includes('selected=PASS_IA&billing=ANNUAL'));
    assert.ok(text.includes('unsubscribe'));
    assert.ok(!text.includes('Aucun paiement') && !text.includes("7 jours d'essai"));
    if (state.duringSend) await state.duringSend();
    if (state.throwSend) throw Error('fixture provider timeout');
    return !state.uncertain;
  } };
  const adapter = load('src/lib/email/registry-prisma.ts', { '@/lib/db/client': { prisma: db } });
  const helper = load('src/lib/email/send-diagnostic-reminder.ts', {
    crypto, '@/lib/db/client': { prisma }, './client': email,
    './registry-prisma': adapter, './diagnostic-suppression': suppression,
    './delivery-registry': { deliverOnce: (database, request) => {
      keys.set(request.deliveryKey, request.recipientKey);
      assert.equal(request.recipientKey, crypto.createHash('sha256').update(state.email).digest('hex'));
      return registry.deliverOnce(database, request);
    } },
  }, '', state.noProvider ? {} : { RESEND_API_KEY: 'fake-not-used' });
  return load('src/app/api/cron/relance-inactifs/route.ts', {
    'next/server': {}, '@/lib/db/client': { prisma }, '@/lib/email/client': email,
    '@/lib/email/send-essential-reminder': {}, '@/lib/cron/auth': {},
    '@/lib/admin/flags': {}, '@/lib/stripe/client': {},
    '@/lib/email/unsubscribe': { buildUnsubscribeLink: () => state.noUnsubscribe ? null : 'http://localhost/unsubscribe' },
    '@/lib/email/diagnostic-suppression': suppression,
    '@/lib/email/send-diagnostic-reminder': helper,
  }, '\nexport {relancerCheckoutsAbandonnes};').relancerCheckoutsAbandonnes;
}
async function fixture(scenario) {
  const id = crypto.randomUUID();
  const state = { id, email: `checkout-${id}@example.test`, sends: 0,
    started: new Date(Date.now() - 3 * 3600000) };
  fixtures.push(state);
  await clients[0].user.create({ data: { id, supabaseAuthId: id, email: state.email,
    checkoutStartedAt: state.started, checkoutPlan: 'PASS_IA', checkoutBillingInterval: 'ANNUAL' } });
  if (scenario !== 'no-consent') await clients[0].diagnosticLead.create({ data: {
    email: state.email, reponses: scenario === 'legacy-consent' ? {} : { marketingConsent: true },
  } });
  return state;
}
(async () => {
  try {
    for (const scenario of ['send', 'no-consent', 'legacy-consent', 'withdrawn', 'active',
      'changed-checkout', 'uncertain', 'timeout', 'marker-failure', 'new-during-send', 'no-provider', 'no-unsubscribe', 'cadence']) {
      const s = await fixture(scenario);
      if (scenario === 'withdrawn') s.beforeFresh = () => clients[0].diagnosticLead.updateMany({
        where: { email: s.email }, data: { optedOutAt: new Date() } });
      if (scenario === 'active') s.beforeFresh = () => clients[0].subscription.create({
        data: { userId: s.id, stripeCustomerId: `cus_fixture_${s.id}`, plan: 'PASS_IA', status: 'ACTIVE' } });
      if (scenario === 'changed-checkout') s.beforeFresh = () => clients[0].user.update({
        where: { id: s.id }, data: { checkoutStartedAt: new Date() } });
      s.uncertain = scenario === 'uncertain'; s.throwSend = scenario === 'timeout';
      s.markerFailure = scenario === 'marker-failure';
      s.noProvider = scenario === 'no-provider'; s.noUnsubscribe = scenario === 'no-unsubscribe';
      if (scenario === 'new-during-send') s.duringSend = () => clients[0].user.update({
        where: { id: s.id }, data: { checkoutStartedAt: new Date(), checkoutReminderSentAt: null } });
      if (scenario === 'cadence') {
        const recipientKey = crypto.createHash('sha256').update(s.email).digest('hex');
        const key = `test-marketing:${s.id}`; keys.set(key, recipientKey);
        const adapter = load('src/lib/email/registry-prisma.ts', { '@/lib/db/client': { prisma: clients[0] } });
        assert.equal(await registry.deliverOnce(adapter.registryDatabase, { deliveryKey: key, recipientKey,
          kind: 'fixture', eligible: async () => true, send: async () => true }), 'SENT');
      }
      const calls = clients.map(db => runner(db, s));
      const results = await Promise.allSettled(calls.map(call => call('http://localhost:3050')));
      const expectedSend = ['send', 'uncertain', 'timeout', 'marker-failure', 'new-during-send'].includes(scenario) ? 1 : 0;
      assert.equal(s.sends, expectedSend, scenario);
      assert.equal(results.filter(r => r.status === 'rejected').length,
        ['timeout', 'marker-failure'].includes(scenario) ? 1 : 0, scenario);
      const row = await clients[0].user.findUniqueOrThrow({ where: { id: s.id } });
      assert.equal(Boolean(row.checkoutReminderSentAt), scenario === 'send', scenario);
      s.markerFailure = false; s.throwSend = false;
      assert.equal(await calls[0]('http://localhost:3050'), 0, scenario + ' retry');
      assert.equal(s.sends, expectedSend, scenario + ' no duplicate');
      console.log(`PASS checkout ${scenario}: actual consent/business rows, two callers, stale list, retry`);
    }
    console.log('LIMIT: provider simulated, no Stripe state or production cron/delivery verified.');
  } finally {
    for (const [key] of keys) await clients[0].$executeRawUnsafe('DELETE FROM email_deliveries WHERE "deliveryKey"=$1', key);
    for (const recipient of new Set(keys.values())) await clients[0].$executeRawUnsafe('DELETE FROM email_recipient_gates WHERE "recipientKey"=$1', recipient);
    for (const s of fixtures) {
      await clients[0].diagnosticLead.deleteMany({ where: { email: s.email } });
      await clients[0].user.deleteMany({ where: { id: s.id, email: s.email } });
    }
    await Promise.all(clients.map(db => db.$disconnect()));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
