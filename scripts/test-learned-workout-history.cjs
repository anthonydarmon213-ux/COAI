const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let entries = [];
let historyCalls = 0;
const prisma = Object.fromEntries(['weeklyCheckin', 'testMaxi', 'repasLog', 'activiteJournaliere', 'dailySession'].map(name => [name, {findMany: async () => []}]));
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/insight/profil-appris.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
}).outputText, {exports: exportsObject, require(name) {
  if (name === '@/lib/db/client') return {prisma};
  if (name === '@/lib/suivi/workout-history') return {workoutHistory: async (userId, options) => {
    historyCalls++;
    assert.equal(userId, 'member'); assert.equal(options.order, 'asc');
    assert(Math.abs(options.from.getTime() - (Date.now() - 90 * 86400000)) < 2000);
    return entries;
  }};
  if (name === '@/lib/tests-maxi/labels') return {LABEL_PAR_EXERCICE: {}};
  if (name === '@/lib/neat/signaux') return {MIN_JOURS_NEAT: 7};
  if (name === '@/lib/insight/tendances-longitudinales') return {buildTendancesDaily: () => []};
  throw Error(name);
}});
(async () => {
  const build = () => exportsObject.buildProfilIntelligence('member');
  assert.equal((await build()).axes[0].actuel, 0);
  entries = Array.from({length: 6}, (_, i) => ({id: `daily:${i}`, date: new Date(Date.now() - i * 7 * 86400000), dureeMinutes: null, douleur: null, douleurZone: null, exercices: []}));
  const result = await build();
  assert.equal(result.axes[0].actuel, 6);
  assert(result.items.some(item => item.label === 'Fréquence habituelle'));
  assert(result.items.some(item => item.label === 'Jour le plus régulier'));
  assert(!result.items.some(item => /durée|zone/i.test(item.label)));
  entries = entries.slice(0, 5);
  assert(!(await build()).items.some(item => item.label === 'Fréquence habituelle'));
  assert.equal(historyCalls, 3);
  console.log('PASS learned profile: combined history, scoped window, evidence thresholds, unknown metrics remain unknown. Dependencies mocked.');
})().catch(error => {console.error(error); process.exitCode = 1;});
