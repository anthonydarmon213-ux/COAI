// Real local PostgreSQL writes; no live AI, WhatsApp, Stripe or Auth calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
if (!process.argv.includes('--local')) throw Error('Explicit --local required');
const db = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' } } });
const id = randomUUID();
const phone = `test-${id}`;
let aiCalls = 0, failAI = false;
function load(file, deps) {
  const box = { exports: {}, Date, console: { error() {} }, require: name => {
    assert(name in deps, name); return deps[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, box);
  return box.exports;
}
const deps = {
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  zod: require('zod'),
  '@/lib/db/client': { prisma: db },
  '@/lib/whatsapp/client': { isValidWhatsappWebhookRequest: () => true },
  '@/lib/auth/server': { getCurrentUser: async () => ({ id }) },
  '@/lib/insight/profil-appris': { buildProfilIntelligence: async () => null },
  '@/lib/subscription/plan': load('src/lib/subscription/plan.ts', {}),
  '@/lib/subscription/coach-quota': load('src/lib/subscription/coach-quota.ts', {}),
  '@/lib/ai/prompts/coach-question': { buildCoachQuestionPrompt: () => 'fixture' },
  '@/lib/ai/client': { generateTextWithAI: async () => { aiCalls++; if (failAI) throw Error('simulated outage'); return 'fixture answer'; } },
};
const whatsapp = load('src/app/api/webhooks/whatsapp-manychat/route.ts', deps);
const web = load('src/app/api/coach/ask/route.ts', deps);
const ask = channel => channel.POST({ json: async () => ({ phoneWhatsapp: phone, message: 'fixture', ...(channel === web ? { question: 'fixture' } : {}) }) });
const askWeb = () => web.POST({ json: async () => ({ question: 'fixture' }) });
async function state() { return db.user.findUniqueOrThrow({ where: { id } }); }
async function reset(used, window = new Date()) {
  aiCalls = 0; failAI = false;
  await db.user.update({ where: { id }, data: { coachQuestionsUsed: used, coachQuestionsResetAt: window } });
}
(async () => {
  try {
    await db.user.create({ data: { id, supabaseAuthId: id, email: `quota-${id}@example.test`, phoneWhatsapp: phone,
      subscription: { create: { stripeCustomerId: `fixture-${id}`, status: 'ACTIVE', plan: 'PASS_IA' } } } });
    await reset(3);
    await Promise.all(Array.from({ length: 12 }, (_, i) => i % 2 ? ask(whatsapp) : askWeb()));
    assert.equal(aiCalls, 1); assert.equal((await state()).coachQuestionsUsed, 4);
    await reset(4, null);
    await Promise.all(Array.from({ length: 12 }, (_, i) => i % 2 ? ask(whatsapp) : askWeb()));
    assert.equal(aiCalls, 4); assert.equal((await state()).coachQuestionsUsed, 4);
    await reset(2); failAI = true;
    await ask(whatsapp);
    assert.equal(aiCalls, 1); assert.equal((await state()).coachQuestionsUsed, 2);
    await db.subscription.update({ where: { userId: id }, data: { status: 'CANCELED' } });
    aiCalls = 0;
    const eventCount = await db.whatsAppEvent.count({ where: { userId: id } });
    await ask(whatsapp);
    assert.equal(aiCalls, 0);
    assert.equal(await db.whatsAppEvent.count({ where: { userId: id } }), eventCount);
    console.log('PASS real local PostgreSQL: mixed web/WhatsApp last slot, concurrent rollover, failed-answer refund, canceled subscription');
  } finally {
    await db.user.deleteMany({ where: { id, email: `quota-${id}@example.test` } });
    assert.equal(await db.user.count({ where: { id } }), 0);
    assert.equal(await db.whatsAppEvent.count({ where: { userId: id } }), 0);
    await db.$disconnect();
    console.log('Disposable local fixture and events removed');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
