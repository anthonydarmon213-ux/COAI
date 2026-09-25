const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let authorized = false, rows = [], sent = [], updates = [], success = true, reads = 0;
const start = new Date(Date.now() - 31 * 86400000);
const user = { id: 'member-a', email: 'fixture@example.test', prenom: 'Test', createdAt: start,
  dernierBilanMensuelEnvoyeAt: null, subscription: { status: 'ACTIVE', trialEnd: null } };
const out = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/cron/bilan-mensuel/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: out, process: { env: { NEXT_PUBLIC_APP_URL: 'https://example.test' } }, require(name) {
  if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
  if (name === '@/lib/cron/auth') return { isAuthorizedCronRequest: () => authorized };
  if (name === '@/lib/db/client') return { prisma: {
    user: { findMany: async () => { reads++; return [user]; }, update: async arg => { updates.push(arg); } },
    mesure: { findMany: async arg => { assert.equal(arg.where.userId, user.id); return []; } },
  } };
  if (name === '@/lib/suivi/workout-history') return { workoutHistory: async (id, options) => {
    assert.equal(id, user.id); assert.equal(options.from, start); assert.equal(options.order, 'asc');
    assert(Math.abs(options.before.getTime() - Date.now()) < 2000); return rows;
  } };
  if (name === '@/lib/email/client') return { sendEmail: async (...args) => { sent.push(args); return success; } };
  throw Error(name);
} });
(async () => {
  assert.equal((await out.GET({})).status, 401); assert.equal(reads, 0);
  authorized = true;
  assert.equal((await out.GET({})).body.bilansEnvoyes, 0); assert.equal(sent.length, 0);
  rows = [{ id: 'daily:completed', date: new Date(), exercices: [] }];
  assert.equal((await out.GET({})).body.bilansEnvoyes, 1);
  assert.equal(sent[0][0], user.email); assert.match(sent[0][2], /1 séance loggée/);
  assert(!sent[0][2].includes('kg'), 'No invented daily performance');
  assert.equal(updates.length, 1); assert.equal(updates[0].where.id, user.id);
  success = false; updates = [];
  assert.equal((await out.GET({})).body.bilansEnvoyes, 0); assert.equal(updates.length, 0);
  success = true;
  rows.push({ date: new Date(), exercices: [] });
  await out.GET({}); assert.match(sent.at(-1)[2], /2 séances loggées/);
  const sentCount = sent.length;
  user.subscription.trialEnd = new Date(Date.now() + 86400000);
  await out.GET({}); assert.equal(sent.length, sentCount);
  console.log('PASS monthly email: authorization, empty, daily-only, mixed, unknown performance, failed send retry, trial guard. DB/history/email mocked; no messages sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });
