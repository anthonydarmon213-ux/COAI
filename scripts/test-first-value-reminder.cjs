// Actual cron + helper + PostgreSQL registry; business rows/provider simulated.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const {PrismaClient} = require('@prisma/client');
const clients = [0, 1].map(() => new PrismaClient({datasources: {db: {
  url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
}}}));
const keys = new Map();
function load(file, imports, extra = '', env = {RESEND_API_KEY: 'fake-not-used'}) {
  const box = {exports: {}, Date, Set, process: {env}, require: name => {
    assert.ok(name in imports, name); return imports[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8') + extra,
    {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, box);
  return box.exports;
}
const registry = load('src/lib/email/delivery-registry.ts', {});
function build(db, state) {
  const user = {id: state.id, email: `${state.id}@example.test`, prenom: 'Test'};
  const prisma = {
    diagnosticLead: {
      findMany: async () => [{email: user.email}],
      findFirst: async q => {
        assert.equal(q.where.email.mode, 'insensitive');
        assert.equal(q.where.optedOutAt, null);
        assert.ok(q.where.createdAt.gte instanceof Date);
        assert.equal(q.where.resultEmailSentAt.not, null);
        return state.consent ? {id: 'lead'} : null;
      },
    },
    user: {
      findMany: async () => [user], // deliberately stale even after a successful send
      findFirst: async q => {
        assert.equal(q.where.id, user.id);
        assert.equal(q.where.email.equals, user.email);
        assert.equal(q.where.subscription, null);
        assert.equal(q.where.programmeUnlockedAt, null);
        assert.equal(q.where.firstValueReminderSentAt, null);
        assert.equal(Object.keys(q.where.seances.none).length, 0);
        assert.ok(q.where.createdAt.lte instanceof Date);
        return state.inactive && !state.updated ? {id: user.id} : null;
      },
      update: async () => {state.updated++;},
    },
  };
  const adapter = load('src/lib/email/registry-prisma.ts', {'@/lib/db/client': {prisma: db}});
  let checks = 0;
  const suppression = {hasDiagnosticOptOut: async () => {
    checks++;
    return state.optout || (state.lateOptout && checks > 1);
  }};
  const email = {sendEmail: async (to, subject, text) => {
    state.sends++; assert.equal(to, user.email);
    assert.ok(text.includes('/suivi/repcount?onboarding=1'));
    assert.ok(text.includes('unsubscribe'));
    return state.accepted;
  }};
  const helper = load('src/lib/email/send-diagnostic-reminder.ts', {
    crypto, '@/lib/db/client': {prisma}, './client': email,
    './registry-prisma': adapter, './diagnostic-suppression': suppression,
    './delivery-registry': {deliverOnce: (database, request) => {
      keys.set(request.deliveryKey, request.recipientKey);
      assert.equal(request.recipientKey, crypto.createHash('sha256').update(user.email).digest('hex'));
      return registry.deliverOnce(database, request);
    }},
  });
  const cron = load('src/app/api/cron/relance-inactifs/route.ts', {
    'next/server': {}, '@/lib/db/client': {prisma}, '@/lib/email/client': email,
    '@/lib/email/send-essential-reminder': {}, '@/lib/cron/auth': {},
    '@/lib/admin/flags': {}, '@/lib/stripe/client': {},
    '@/lib/email/unsubscribe': {buildUnsubscribeLink: () => 'http://localhost/unsubscribe'},
    '@/lib/email/diagnostic-suppression': suppression,
    '@/lib/email/send-diagnostic-reminder': helper,
  }, '\nexport {relancerComptesSansPremierRepere};');
  return () => cron.relancerComptesSansPremierRepere('http://localhost:3050');
}
(async () => {
  try {
    for (const scenario of ['send', 'active', 'consent-removed', 'optout', 'late-optout', 'uncertain']) {
      const state = {id: crypto.randomUUID(), consent: scenario !== 'consent-removed',
        optout: scenario === 'optout', lateOptout: scenario === 'late-optout', inactive: scenario !== 'active',
        accepted: scenario !== 'uncertain', sends: 0, updated: 0};
      const calls = clients.map(db => build(db, state));
      const results = await Promise.all(calls.map(call => call()));
      const sends = ['send', 'uncertain'].includes(scenario) ? 1 : 0;
      assert.equal(state.sends, sends);
      assert.equal(state.updated, scenario === 'send' ? 1 : 0);
      assert.equal(results.reduce((a,b) => a+b, 0), state.updated);
      assert.equal(await calls[0](), 0);
      assert.equal(state.sends, sends);
      console.log(`PASS first-value ${scenario}: concurrent callers, stale list, retry`);
    }
    const unavailable = load('src/lib/email/send-diagnostic-reminder.ts', {
      crypto, '@/lib/db/client': {}, './client': {}, './registry-prisma': {},
      './diagnostic-suppression': {}, './delivery-registry': {
        deliverOnce: () => {throw Error('must not reserve');},
      },
    }, '', {});
    assert.equal(await unavailable.sendFirstValueReminder({}), false);
    console.log('PASS missing provider reserves nothing. LIMIT: no external email or production cron.');
  } finally {
    for (const [key, recipient] of keys) {
      await clients[0].$executeRawUnsafe('DELETE FROM email_deliveries WHERE "deliveryKey"=$1', key);
      await clients[0].$executeRawUnsafe('DELETE FROM email_recipient_gates WHERE "recipientKey"=$1', recipient);
    }
    await Promise.all(clients.map(db => db.$disconnect()));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
