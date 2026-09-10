// Real cron functions, essential helper, registry and Prisma adapter.
// Business candidates and email provider simulated; registry in local PostgreSQL.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
const clients = [0, 1].map(() => new PrismaClient({datasources: {db: {
  url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
}}}));
const keys = new Set();
function load(file, imports = {}, extra = '', env = {}) {
  const box = {exports: {}, Date, process: {env}, require: name => {
    assert.ok(name in imports, name); return imports[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8') + extra, {
    compilerOptions: {module: ts.ModuleKind.CommonJS},
  }).outputText, box);
  return box.exports;
}
const registry = load('src/lib/email/delivery-registry.ts');
const helpers = clients.map(prisma => {
  const adapter = load('src/lib/email/registry-prisma.ts', {'@/lib/db/client': {prisma}});
  return load('src/lib/email/send-essential-reminder.ts', {
    'node:crypto': crypto, './registry-prisma': adapter,
    './delivery-registry': {deliverOnce: (db, request) => {
      keys.add(request.deliveryKey); return registry.deliverOnce(db, request);
    }},
  }, '', {RESEND_API_KEY: 'fake-not-used'});
});
function cron(helper, kind, state) {
  const candidate = {id: state.id, plan: 'PASS_IA', paymentFailedAt: state.failure,
    user: {email: 'fixture@example.test', prenom: 'Test'}};
  const imports = {
    'next/server': {}, '@/lib/db/client': {prisma: {subscription: {
      findMany: async query => {
        assert.equal(query.where.status, kind === 'trial-activation' ? 'ACTIVE' : 'PAST_DUE');
        return [candidate]; // deliberately stale list, including after send
      },
      findFirst: async query => {
        assert.equal(query.where.id, state.id);
        assert.equal(query.where.cancelAtPeriodEnd, false);
        if (kind === 'trial-activation') {
          assert.ok(query.where.trialEnd.gt instanceof Date);
          assert.ok(query.where.user.programmes.none);
        } else assert.equal(query.where.paymentFailedAt, state.failure);
        return state.eligible && !state.updated ? {id: state.id} : null;
      },
      update: async () => {state.updated++;},
      updateMany: async query => {
        assert.equal(query.where.paymentFailedAt, state.failure);
        assert.equal(query.where.status, 'PAST_DUE');
        state.updated++; return {count: 1};
      },
    }}},
    '@/lib/email/client': {sendEmail: async (...args) => {
      state.sends++; state.message = args[2]; return state.sent;
    }},
    '@/lib/email/send-essential-reminder': helper,
    '@/lib/cron/auth': {}, '@/lib/admin/flags': {}, '@/lib/email/unsubscribe': {},
    '@/lib/email/diagnostic-suppression': {}, '@/lib/stripe/client': {},
    '@/lib/email/send-diagnostic-reminder': {},
  };
  const module = load('src/app/api/cron/relance-inactifs/route.ts', imports,
    '\nexport {relancerEssaisNonActives, relancerPaiementsEnRetard};');
  return () => module[kind === 'trial-activation' ? 'relancerEssaisNonActives' : 'relancerPaiementsEnRetard']('http://localhost:3050');
}
(async () => {
  try {
    for (const kind of ['trial-activation', 'payment-recovery']) {
      for (const [eligible, sent] of [[true, true], [false, true], [true, false]]) {
        const state = {id: crypto.randomUUID(), failure: new Date(Date.now() - 3*86400000),
          eligible, sent, sends: 0, updated: 0};
        const calls = helpers.map(helper => cron(helper, kind, state));
        const results = await Promise.all(calls.map(call => call()));
        assert.equal(state.sends, eligible ? 1 : 0);
        assert.equal(state.updated, eligible && sent ? 1 : 0);
        assert.equal(results.reduce((a,b) => a+b, 0), eligible && sent ? 1 : 0);
        assert.equal(await calls[0](), 0);
        assert.equal(state.sends, eligible ? 1 : 0);
        if (eligible) assert.ok(state.message.includes(kind === 'trial-activation' ? '/bienvenue?plan=PASS_IA' : '/compte/abonnement'));
        console.log(`PASS ${kind}: concurrent callers, eligible=${eligible}, accepted=${sent}, no duplicate`);
      }
    }
    // A missing provider must not consume a reservation.
    const unavailable = load('src/lib/email/send-essential-reminder.ts', {
      'node:crypto': crypto, './registry-prisma': {},
      './delivery-registry': {deliverOnce: () => {throw Error('must not reserve');}},
    });
    assert.equal(await unavailable.sendEssentialReminder({kind: 'trial-activation', eventId: 'test'}), false);
    // Two separate billing incidents remain independently deliverable.
    let sends = 0;
    const id = crypto.randomUUID();
    for (const eventId of [id + ':first', id + ':second']) {
      assert.equal(await helpers[0].sendEssentialReminder({kind: 'payment-recovery', eventId,
        eligible: async () => true, send: async () => {sends++; return true;}}), true);
    }
    assert.equal(sends, 2);
    console.log('PASS missing provider reserves nothing; distinct payment incidents are independent');
    console.log('LIMIT: business records simulated; no real provider or production cron invoked');
  } finally {
    for (const key of keys) {
      await clients[0].$executeRawUnsafe('DELETE FROM email_deliveries WHERE "deliveryKey"=$1', key);
      await clients[0].$executeRawUnsafe('DELETE FROM email_recipient_gates WHERE "recipientKey"=$1', key);
    }
    await Promise.all(clients.map(db => db.$disconnect()));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
