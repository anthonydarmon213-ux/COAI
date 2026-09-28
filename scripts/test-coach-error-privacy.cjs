// Execute the real route with synthetic Auth/DB/AI. No provider network calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const consentBox = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/ai/coach-consent.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, consentBox);
const consent = consentBox.exports;
const source = ts.transpileModule(fs.readFileSync('src/app/api/coach/ask/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
async function run(mode) {
  const logs = []; let aiCalls = 0, memoryCalls = 0, reserved = 0, refunded = 0, reads = 0;
  const error = Object.assign(new Error('PRIVATE-health-context'), { request: { body: 'PRIVATE-question', authorization: 'PRIVATE-key' } });
  const limited = mode === 'limited-provider-error';
  const dependencies = {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    zod: require('zod'),
    '@/lib/ai/coach-consent': consent,
    '@/lib/auth/server': { getCurrentUser: async () => mode === 'unauthenticated' ? null : { id: 'auth-fixture' } },
    '@/lib/subscription/plan': { hasPaidSubscription: () => mode !== 'unpaid', getEffectivePlan: () => limited ? 'PASS_IA' : 'STANDARD' },
    '@/lib/subscription/coach-quota': { COACH_QUOTA_LIMIT: 5, getCoachQuotaState: () => ({ expired: false }) },
    '@/lib/db/client': { prisma: { user: {
      findUnique: async () => { reads++; return { id: 'local-fixture', subscription: {}, profile: {}, coachQuestionsUsed: 0 }; },
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
    method: 'POST', headers: { 'content-type': 'application/json', ...(mode === 'no-consent' ? {} : mode === 'old-consent' ? { [consent.AI_COACH_CONSENT_HEADER]: 'anthropic-coach-v0' } : mode === 'image-consent' ? { 'x-coai-ai-image-consent': 'anthropic-image-v1:repas' } : consent.aiCoachConsentHeaders(true)) }, body: JSON.stringify({ question: 'Synthetic question' }),
  }));
  const body = await response.text();
  assert(!body.includes('PRIVATE'));
  assert(!JSON.stringify(logs).includes('PRIVATE'), 'logs must not include provider/database request details');
  if (['no-consent', 'old-consent', 'image-consent'].includes(mode)) {
    assert.equal(response.status, 403); assert.equal(JSON.parse(body).code, 'AI_COACH_CONSENT_REQUIRED');
    assert.equal(reads, 0); assert.equal(aiCalls, 0); assert.equal(memoryCalls, 0); assert.equal(logs.length, 0);
  } else if (mode === 'unauthenticated' || mode === 'unpaid') {
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
  for (const mode of ['success', 'memory-error', 'provider-error', 'limited-provider-error', 'unauthenticated', 'unpaid', 'no-consent', 'old-consent', 'image-consent']) await run(mode);
  console.log('PASS nine real coach route scenarios: consent before profile/quota/AI, private errors omitted, memory fallback and quota refund preserved; services simulated.');
})().catch(error => { console.error(error); process.exitCode = 1; });
