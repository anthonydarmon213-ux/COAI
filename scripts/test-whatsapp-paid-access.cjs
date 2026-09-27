const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps, logs = []) {
  const box = { exports: {}, Date, console: { error: (...args) => logs.push(args) }, require: name => {
    assert(name in deps, `Unexpected dependency ${name}`); return deps[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, box);
  return box.exports;
}
const plans = load('src/lib/subscription/plan.ts', {});
async function run(subscription, options = {}) {
  let ai = 0, writes = 0, reads = 0;
  const logs = [];
  const route = load('src/app/api/webhooks/whatsapp-manychat/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
    zod: require('zod'),
    '@/lib/whatsapp/client': { isValidWhatsappWebhookRequest: () => !options.unauthorized },
    '@/lib/subscription/plan': plans,
    '@/lib/ai/prompts/coach-question': { buildCoachQuestionPrompt: () => 'fixture' },
    '@/lib/ai/client': { generateTextWithAI: async () => { ai++; if (options.fail) throw Error('SECRET provider payload'); return 'Fixture answer'; } },
    '@/lib/db/client': { prisma: {
      user: { findUnique: async () => { reads++; return options.missing ? null : { id: 'fixture', subscription, profile: {}, coachQuestionsUsed: 0, coachQuestionsResetAt: new Date() }; }, update: async () => { writes++; } },
      whatsAppEvent: { create: async () => { writes++; } },
    } },
  }, logs);
  const response = await route.POST({ json: async () => ({ phoneWhatsapp: '00000000', message: 'Fixture question' }) });
  return { response, ai, writes, reads, logs };
}
(async () => {
  for (const subscription of [null, ...['CANCELED', 'PAST_DUE', 'INCOMPLETE', 'UNPAID'].map(status => ({ status, plan: 'PREMIUM' }))]) {
    const result = await run(subscription);
    assert.equal(result.ai, 0); assert.equal(result.writes, 0);
    assert.equal(result.response.status, 200);
    assert.match(result.response.body.reply, /abonnement actif/);
  }
  for (const plan of ['PASS_IA', 'STANDARD', 'PREMIUM']) {
    const result = await run({ status: 'ACTIVE', plan });
    assert.equal(result.ai, 1); assert.equal(result.response.body.reply, 'Fixture answer');
  }
  const denied = await run(null, { unauthorized: true });
  assert.equal(denied.response.status, 401); assert.equal(denied.reads, 0);
  const missing = await run(null, { missing: true });
  assert.equal(missing.ai, 0); assert.equal(missing.writes, 0);
  const failure = await run({ status: 'ACTIVE', plan: 'STANDARD' }, { fail: true });
  assert(!JSON.stringify(failure.logs).includes('SECRET'));
  console.log('PASS WhatsApp paid access: inactive blocked before AI/storage/quota; active tiers preserved; auth and error privacy checked');
})().catch(error => { console.error(error); process.exitCode = 1; });
