const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
let logs = [], dailies = [];
const prisma = {
  user: { findUnique: async q => { assert.equal(q.where.id, 'member'); return { createdAt: new Date('2026-01-01') }; } },
  seanceLog: { findMany: async q => { assert.equal(q.where.userId, 'member'); assert.equal(q.take, 1); return logs; } },
  dailySession: { findMany: async q => {
    assert.equal(q.where.userId, 'member'); assert.equal(q.where.completedAt.not, null);
    assert.equal(q.take, 1); return dailies;
  } },
  programmeGenerated: { findMany: async () => [] },
  programmeAdaptation: { findMany: async q => { assert.equal(q.where.decision.not, 'GARDER'); return []; } },
  weeklyCheckin: { findMany: async () => [] }, testMaxi: { findMany: async () => [] },
};
function load(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require(name) {
    if (name === '@/lib/db/client') return { prisma };
    if (Object.hasOwn(imports, name)) return imports[name];
    throw Error(name);
  } });
  return exports;
}
const history = load('src/lib/suivi/workout-history.ts', { 'server-only': {} });
const timeline = load('src/lib/timeline/evenements.ts', {
  '@/lib/suivi/workout-history': history, '@/lib/tests-maxi/labels': { LABEL_PAR_EXERCICE: {} },
});
(async () => {
  const first = async () => (await timeline.buildTimeline('member')).filter(e => e.titre === 'Première séance terminée');
  assert.equal((await first()).length, 0);
  dailies = [{ id: 'daily', userId: 'member', date: new Date('2026-02-01'), completedAt: new Date('2026-02-01T12:00:00Z') }];
  assert.equal((await first())[0].date.toISOString().slice(0, 10), '2026-02-01');
  logs = [{ id: 'log', date: new Date('2026-03-01'), createdAt: new Date('2026-03-01') }];
  assert.equal((await first())[0].date.toISOString().slice(0, 10), '2026-02-01');
  logs[0].date = new Date('2026-01-15');
  const result = await first(); assert.equal(result.length, 1);
  assert.equal(result[0].date.toISOString().slice(0, 10), '2026-01-15');
  dailies = []; assert.equal((await first()).length, 1);
  console.log('PASS timeline: daily-only, mixed histories, earliest workout, single milestone, empty history. Real history merge; DB mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
