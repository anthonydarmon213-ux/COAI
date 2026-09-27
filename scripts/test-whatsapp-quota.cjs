const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps) {
  const box = { exports: {}, Date, console: { error() {} }, require: name => {
    assert(name in deps, name); return deps[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, box);
  return box.exports;
}
async function scenario({ used, expired = false, count = 1, fail = false, changeWindow = false, failSave = false }) {
  const state = { used, window: expired ? null : new Date(), ai: 0, resets: 0 };
  const user = {
    findUnique: async () => ({ id: 'fixture', subscription: { status: 'ACTIVE', plan: 'PASS_IA' },
      coachQuestionsUsed: state.used, coachQuestionsResetAt: state.window, profile: {} }),
    updateMany: async ({ where, data }) => {
      if ((where.coachQuestionsResetAt?.getTime() ?? null) !== (state.window?.getTime() ?? null)) return { count: 0 };
      if (where.coachQuestionsUsed?.lt !== undefined && state.used >= where.coachQuestionsUsed.lt) return { count: 0 };
      if (where.coachQuestionsUsed?.gt !== undefined && state.used <= where.coachQuestionsUsed.gt) return { count: 0 };
      if (data.coachQuestionsResetAt) { state.window = data.coachQuestionsResetAt; state.used = 0; state.resets++; }
      if (data.coachQuestionsUsed?.increment) state.used++;
      if (data.coachQuestionsUsed?.decrement) state.used--;
      return { count: 1 };
    },
  };
  const route = load('src/app/api/webhooks/whatsapp-manychat/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
    zod: require('zod'),
    '@/lib/whatsapp/client': { isValidWhatsappWebhookRequest: () => true },
    '@/lib/subscription/plan': load('src/lib/subscription/plan.ts', {}),
    '@/lib/subscription/coach-quota': load('src/lib/subscription/coach-quota.ts', {}),
    '@/lib/ai/prompts/coach-question': { buildCoachQuestionPrompt: () => 'fixture' },
    '@/lib/ai/client': { generateTextWithAI: async () => {
      state.ai++;
      if (changeWindow) { state.window = new Date(Date.now() + 10000); state.used = 2; }
      if (fail) throw Error('simulated outage');
      return 'answer';
    } },
    '@/lib/db/client': { prisma: { user, whatsAppEvent: { create: async ({ data }) => {
      if (failSave && data.direction === 'OUTBOUND') throw Error('storage outage');
    } } } },
  });
  const responses = await Promise.all(Array.from({ length: count }, () => route.POST({ json: async () => ({ phoneWhatsapp: '00000000', message: 'fixture' }) })));
  return { ...state, responses };
}
(async () => {
  let result = await scenario({ used: 3, count: 8 });
  assert.equal(result.used, 4); assert.equal(result.ai, 1);
  assert.equal(result.responses.filter(r => r.body.reply === 'answer').length, 1);
  result = await scenario({ used: 4, expired: true, count: 8 });
  assert.equal(result.resets, 1); assert.equal(result.used, 4); assert.equal(result.ai, 4);
  result = await scenario({ used: 2, fail: true });
  assert.equal(result.used, 2); assert.equal(result.ai, 1);
  result = await scenario({ used: 2, failSave: true });
  assert.equal(result.used, 2);
  result = await scenario({ used: 2, fail: true, changeWindow: true });
  assert.equal(result.used, 2, 'late failure must preserve new window');
  console.log('PASS WhatsApp quota: concurrent last slot, single rollover, AI/save failure refund, late failure window isolation (mock database)');
})().catch(error => { console.error(error); process.exitCode = 1; });
