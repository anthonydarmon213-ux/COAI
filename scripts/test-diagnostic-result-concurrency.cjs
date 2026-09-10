// Actual public route/helper/registry on disposable PostgreSQL; providers mocked.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const crypto = require('node:crypto'), ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
const clients = [0, 1].map(() => new PrismaClient({ datasources: { db: {
  url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
} } }));
const prefix = `result-${crypto.randomUUID()}`;
const emails = ['parallel','false','throw','marker','missing','legacy'].map(s => `${prefix}-${s}@example.test`);
const deliveries = [], errors = [];
let sends = 0, behavior = 'true', failMarker = false, events = 0;
function load(file, imports = {}, configured = true) {
  const box = { exports: {}, console: { error: (...args) => errors.push(args) },
    process: { env: configured ? { RESEND_API_KEY: 'fixture-not-used' } : {} },
    require: name => { assert.ok(name in imports, name); return imports[name]; },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, box);
  return box.exports;
}
const registry = load('src/lib/email/delivery-registry.ts');
function route(db, configured = true) {
  const adapter = load('src/lib/email/registry-prisma.ts', { '@/lib/db/client': { prisma: db } });
  const helper = load('src/lib/email/send-diagnostic-result.ts', {
    'node:crypto': crypto, '@/lib/db/client': { prisma: db }, './registry-prisma': adapter,
    './delivery-registry': { deliverOnce: (database, request) => {
      deliveries.push(request); return registry.deliverOnce(database, request);
    } },
  }, configured);
  const prisma = { user: db.user, programmeGenerated: db.programmeGenerated,
    diagnosticLead: { create: args => db.diagnosticLead.create(args), update: args => {
      if (failMarker) throw Error('fixture marker failure');
      return db.diagnosticLead.update(args);
    } },
  };
  return load('src/app/api/diagnostic-lead/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    zod: require('zod'), '@/lib/db/client': { prisma },
    '@/lib/email/client': { sendAdminNotification: async () => { throw Error('marketing must remain off'); },
      sendEmail: async () => { sends++; if (behavior === 'throw') throw Error('fixture provider timeout'); return behavior === 'true'; } },
    '@/lib/email/lead-notification': { buildNouveauLeadEmailHtml: () => '', buildWhatsAppLinkVersLead: () => '' },
    '@/lib/diagnostic/mini-diagnostic': {
      buildMiniDiagnostic: () => ({ indiceCoai: { score: 50, niveau: 'test' }, recommandation: { label: 'test', raison: 'test' }, pointsATravailler: [], pointsResolus: [] }),
      miniDiagnosticEnTexte: () => 'fixture result',
    },
    '@/lib/analytics/product-events': { trackServerEvent: () => { events++; } },
    '@/lib/hubspot/contact': { synchroniserLeadHubSpot: async () => { throw Error('marketing must remain off'); } },
    '@/lib/email/diagnostic-suppression': { hasDiagnosticOptOut: async () => true },
    '@/lib/email/send-diagnostic-result': helper,
  }).POST;
}
const routes = clients.map(db => route(db));
const post = (handler, email) => handler(new Request('http://localhost/api/diagnostic-lead', {
  method: 'POST', body: JSON.stringify({ email, reponses: { fixture: true }, marketingConsent: false }),
}));
(async () => {
  const db = clients[0];
  try {
    const responses = await Promise.all([0, 1, 0, 1].map((n, i) => post(routes[n], i % 2 ? emails[0].toUpperCase() : emails[0])));
    assert.ok(responses.every(r => r.status === 201)); assert.equal(sends, 1); assert.equal(events, 1);
    assert.equal(await db.diagnosticLead.count({ where: { email: emails[0], resultEmailSentAt: { not: null } } }), 1);
    const key = deliveries.find(d => d.kind === 'diagnostic-result').recipientKey;
    const gates = await db.$queryRawUnsafe('SELECT "activeDeliveryKey", EXTRACT(EPOCH FROM ("nextAllowedAt"-CURRENT_TIMESTAMP)) AS remaining FROM email_recipient_gates WHERE "recipientKey"=$1', key);
    assert.equal(gates[0].activeDeliveryKey, null);
    assert.ok(Number(gates[0].remaining) > 250 && Number(gates[0].remaining) <= 300);
    await post(routes[0], emails[0]); assert.equal(sends, 1);
    // Advance only this fixture's persisted clock to verify later legitimate results.
    await db.$executeRawUnsafe('UPDATE email_recipient_gates SET "nextAllowedAt"=CURRENT_TIMESTAMP-INTERVAL \'1 minute\' WHERE "recipientKey"=$1', key);
    await db.diagnosticLead.updateMany({ where: { email: emails[0], resultEmailSentAt: { not: null } }, data: { resultEmailSentAt: new Date(Date.now() - 600000) } });
    await post(routes[0], emails[0]); assert.equal(sends, 2);

    for (const [index, mode] of [[1, 'false'], [2, 'throw']]) {
      behavior = mode; const before = sends;
      assert.equal((await post(routes[0], emails[index])).status, 201);
      assert.equal((await post(routes[1], emails[index])).status, 201);
      assert.equal(sends, before + 1);
      assert.equal(await db.diagnosticLead.count({ where: { email: emails[index], resultEmailSentAt: { not: null } } }), 0);
      const request = deliveries.find(d => d.recipientKey.endsWith(crypto.createHash('sha256').update(emails[index]).digest('hex')));
      const rows = await db.$queryRawUnsafe('SELECT state FROM email_deliveries WHERE "deliveryKey"=$1', request.deliveryKey);
      assert.equal(rows[0].state, 'UNCERTAIN');
    }
    behavior = 'true'; failMarker = true;
    const beforeMarker = sends;
    assert.equal((await post(routes[0], emails[3])).status, 201);
    failMarker = false; await post(routes[1], emails[3]); assert.equal(sends, beforeMarker + 1);
    assert.equal(await db.diagnosticLead.count({ where: { email: emails[3], resultEmailSentAt: { not: null } } }), 0);
    const beforeMissing = deliveries.length;
    assert.equal((await post(route(db, false), emails[4])).status, 201);
    assert.equal(deliveries.length, beforeMissing);
    await db.diagnosticLead.create({ data: { email: emails[5], reponses: { fixture: true }, resultEmailSentAt: new Date() } });
    const beforeLegacy = sends; await post(routes[0], emails[5]); assert.equal(sends, beforeLegacy);
    assert.equal(errors.length, 2); // simulated timeout and post-send marker failure
    console.log('PASS actual route/helper/registry: four callers → one result; 5-minute cooldown; later result allowed; missing provider no reservation; legacy respected; timeout/false/marker failure do not blindly resend; 201 preserved');
    console.log('LIMIT: provider acceptance simulated, not inbox delivery; uncertain reservations require reconciliation; CRM/admin are not deduplicated here.');
  } finally {
    for (const d of deliveries) await db.$executeRawUnsafe('DELETE FROM email_deliveries WHERE "deliveryKey"=$1', d.deliveryKey);
    for (const key of new Set(deliveries.map(d => d.recipientKey))) await db.$executeRawUnsafe('DELETE FROM email_recipient_gates WHERE "recipientKey"=$1', key);
    await db.diagnosticLead.deleteMany({ where: { email: { in: emails } } });
    await Promise.all(clients.map(db => db.$disconnect()));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
