// Actual reminder function, mocked persistence/provider; no real email or API.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/app/api/cron/relance-inactifs/route.ts', 'utf8');
const compiled = ts.transpileModule(source + '\nexport { relancerEssaisNonActives };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
(async () => {
  for (const sent of [true, false]) {
    const updates = [], emails = [];
    const imports = {
      'next/server': {},
      '@/lib/db/client': { prisma: { subscription: {
        findMany: async query => {
          assert.equal(query.where.status, 'ACTIVE');
          assert.equal(query.where.cancelAtPeriodEnd, false);
          assert.equal(query.where.trialActivationReminderSentAt, null);
          assert.ok(query.where.trialEnd.gt instanceof Date);
          assert.ok(query.where.user.programmes.none);
          return [{ id: 'fictional-sub', plan: 'PASS_IA', user: { email: 'test@example.test', prenom: 'Test' } }];
        },
        update: async query => updates.push(query),
      } } },
      '@/lib/email/client': { sendEmail: async (...args) => { emails.push(args); return sent; } },
      '@/lib/cron/auth': {}, '@/lib/admin/flags': {}, '@/lib/email/unsubscribe': {},
      '@/lib/email/diagnostic-suppression': {}, '@/lib/stripe/client': {},
      '@/lib/email/send-diagnostic-reminder': {},
    };
    const box = { exports: {}, Date, require: name => { assert.ok(name in imports, name); return imports[name]; } };
    vm.runInNewContext(compiled, box);
    assert.equal(await box.exports.relancerEssaisNonActives('http://localhost:3050'), sent ? 1 : 0);
    assert.equal(emails.length, 1);
    assert.ok(emails[0][2].includes('/bienvenue?plan=PASS_IA'));
    assert.ok(emails[0][2].includes('/compte/abonnement'));
    assert.ok(!emails[0][2].includes('toujours de tes 7 jours'));
    assert.equal(updates.length, sent ? 1 : 0);
    console.log(`PASS trial reminder: correct activation link, provider success=${sent}`);
  }
  const planBox = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/subscription/plan.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, planBox);
  const welcome = ts.transpileModule(fs.readFileSync('src/app/(app)/bienvenue/page.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  for (const [status, checkout] of [[null, false], ['ACTIVE', false], ['CANCELED', false], ['PAST_DUE', false], ['ACTIVE', true]]) {
    const element = (type, props) => ({ type, props });
    const imports = {
      'react/jsx-runtime': { jsx: element, jsxs: element }, 'next/link': {},
      '@/lib/auth/server': { getCurrentAppUser: async () => ({ id: 'test', profile: {}, subscription: status ? {
        status, plan: 'PASS_IA', trialEnd: new Date(Date.now() + 86400000),
      } : null }) },
      '@/components/ui/section-label': {}, '@/components/ui/button': {},
      '@/components/onboarding/activation-flow': { ActivationFlow: 'activation' },
      '@/components/analytics/track-conversion': { TrackConversion: 'conversion' },
      '@/lib/subscription/plan': planBox.exports,
      '@/lib/stripe/client': { stripe: { checkout: { sessions: { retrieve: async () => {
        assert.ok(checkout);
        return { id: 'cs_test_fixture', status: 'complete', mode: 'subscription', client_reference_id: 'test',
          subscription: { metadata: { plan: 'PASS_IA' }, trial_end: Math.floor(Date.now()/1000)+86400,
            items: { data: [{ price: { unit_amount: 1999, recurring: { interval: 'month', interval_count: 1 } } }] } } };
      } } } } },
    };
    const box = { exports: {}, require: name => { assert.ok(name in imports, name); return imports[name]; } };
    vm.runInNewContext(welcome, box);
    const tree = await box.exports.default({ searchParams: { plan: 'PASS_IA', ...(checkout ? {session_id: 'cs_test_fixture'} : {}) } });
    const nodes = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      nodes.push(node); walk(node.props?.children);
    }
    walk(tree);
    const activation = nodes.find(node => node.type === 'activation');
    assert.ok(activation);
    assert.equal(activation.props.declencherGenerationAuto !== false, status === 'ACTIVE');
    assert.equal(nodes.filter(node => node.type === 'conversion').length, checkout ? 2 : 0);
    assert.equal(JSON.stringify(tree).includes("Tes 7 jours d'essai commencent"), checkout);
    console.log(`PASS activation destination: ${status ?? 'no subscription'}, verified checkout=${checkout}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
