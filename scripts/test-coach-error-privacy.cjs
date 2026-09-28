// Execute the real route with synthetic Auth/DB/AI. No provider network calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/app/api/coach/ask/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
async function run(mode) {
  const logs = []; let aiCalls = 0, memoryCalls = 0, reserved = 0, refunded = 0;
  const error = Object.assign(new Error('PRIVATE-health-context'), { request: { body: 'PRIVATE-question', authorization: 'PRIVATE-key' } });
  const limited = mode === 'limited-provider-error';
  const dependencies = {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    zod: require('zod'),
    '@/lib/auth/server': { getCurrentUser: async () => mode === 'unauthenticated' ? null : { id: 'auth-fixture' } },
    '@/lib/subscription/plan': { hasPaidSubscription: () => mode !== 'unpaid', getEffectivePlan: () => limited ? 'PASS_IA' : 'STANDARD' },
    '@/lib/subscription/coach-quota': { COACH_QUOTA_LIMIT: 5, getCoachQuotaState: () => ({ expired: false }) },
    '@/lib/db/client': { prisma: { user: {
      findUnique: async () => ({ id: 'local-fixture', subscription: {}, profile: {}, coachQuestionsUsed: 0 }),
      updateMany: async () => { reserved++; return { count: 1 }; },
      update: async ({ data }) => { assert.equal(data.coachQuestionsUsed.decrement, 1); refunded++; },
    } } },
    '@/lib/insight/profil-appris': { buildProfilIntelligence: async () => {
      memoryCalls++; if (mode === 'memory-error') throw error; return null;
    } },
    '@/lib/ai/prompts/coach-question': { buildCoachQuestionPrompt: () => 'synthetic prompt' },
    '@/lib/ai/client': { generateTextWithAI: async () => {
      aiCalls++; if (mode.includes('provider-error')) throw error; return 'Synthetic answer';
    } },
  };
  const box = { exports: {}, Date, console: { error: (...args) => logs.push(args) },
    require: key => { assert(key in dependencies, key); return dependencies[key]; } };
  vm.runInNewContext(source, box);
  const response = await box.exports.POST(new Request('http://localhost/api/coach/ask', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'Synthetic question' }),
  }));
  const body = await response.text();
  assert(!body.includes('PRIVATE'));
  assert(!JSON.stringify(logs).includes('PRIVATE'), 'logs must not include provider/database request details');
  if (mode === 'unauthenticated' || mode === 'unpaid') {
    assert.equal(response.status, mode === 'unpaid' ? 402 : 401);
    assert.equal(aiCalls, 0); assert.equal(memoryCalls, 0); assert.equal(logs.length, 0);
  } else if (mode.includes('provider-error')) {
    assert.equal(response.status, 502); assert.equal(aiCalls, 1);
    assert.deepEqual(logs, [['[coach/ask] Réponse IA indisponible']]);
  } else {
    assert.equal(response.status, 200); assert.equal(JSON.parse(body).answer, 'Synthetic answer');
    assert.equal(aiCalls, 1);
    assert.deepEqual(logs, mode === 'memory-error' ? [['[coach/ask:memory] Contexte temporairement indisponible']] : []);
  }
  assert.equal(reserved, limited ? 1 : 0); assert.equal(refunded, limited ? 1 : 0);
}
(async () => {
  for (const mode of ['success', 'memory-error', 'provider-error', 'limited-provider-error', 'unauthenticated', 'unpaid']) await run(mode);
  console.log('PASS six real coach route scenarios: private error payloads omitted, memory fallback and quota refund preserved; all services simulated.');
})().catch(error => { console.error(error); process.exitCode = 1; });
