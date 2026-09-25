const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
let latest = [], recent = [], reads = [];
const out = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/admin/flags.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: out, require(name) {
  if (name === '@/lib/db/client') return { prisma: {
    mesure: { findFirst: async a => { assert.equal(a.where.userId, 'member'); return { date: new Date() }; } },
    testMaxi: { findMany: async () => [] }, weeklyCheckin: { findMany: async () => [] },
  } };
  if (name === '@/lib/suivi/workout-history') return { workoutHistory: async (id, options) => {
    assert.equal(id, 'member'); reads.push(options);
    if (options.take === 1) return latest;
    assert(Math.abs(options.from.getTime() - (Date.now() - 14 * 86400000)) < 2000);
    return recent;
  } };
  throw Error(name);
} });
(async () => {
  assert.equal((await out.computeFlags('member'))[0].type, 'inactivite');
  latest = [{ date: new Date(), dailySessionId: 'daily-fixture' }];
  assert.equal((await out.computeFlags('member')).length, 0);
  recent = [{ ...latest[0], dailyPain: true, notes: null }];
  const pain = await out.computeFlags('member');
  assert.equal(pain.length, 1); assert.equal(pain[0].type, 'douleur');
  assert.match(pain[0].detail, /Douleur déclarée après la séance/);
  assert(!/IMPORTANTE|LEGERE|diagnostic/.test(pain[0].detail));
  recent[0].dailyPain = false;
  assert.equal((await out.computeFlags('member')).length, 0);
  recent[0].douleur = 'LEGERE';
  assert.equal((await out.computeFlags('member'))[0].type, 'douleur');
  recent[0].douleur = 'AUCUNE'; recent[0].notes = 'gêne signalée';
  assert.equal((await out.computeFlags('member'))[0].type, 'douleur');
  recent = []; latest = [{ date: new Date(Date.now() - 12 * 86400000) }];
  assert.match((await out.computeFlags('member'))[0].detail, /12 jours/);
  console.log('PASS coach flags: daily activity prevents false inactivity, declared pain without invented severity, legacy text/structured pain, genuine inactivity. History/DB mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
