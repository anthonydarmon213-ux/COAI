const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const base = {nombreSeancesRecentes: 0, moyenneDifficulte: null, moyenneEnergie: null,
  douleurRecente: null, checkinHebdo: null, tendancePoidsKg: null, regressionPerf: null,
  versionActuelle: null, joursDepuisDerniereVersion: null, adherenceRepas: null};
let signals = {...base};
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  }).outputText, {exports, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name];
  }, Date});
  return exports;
}
const collector = load('src/lib/adaptation/signals.ts', {'@/lib/db/client': {prisma: {}}});
const {getCoaiInsight} = load('src/lib/insight/coai-insight.ts', {
  '@/lib/db/client': {prisma: {programmeAdaptation: {findFirst: async query => {
    assert.equal(query.where.userId, 'local-test'); return null;
  }}}},
  '@/lib/adaptation/signals': {...collector, collecterSignaux: async () => signals},
  '@/lib/neat/signaux': {collecterSignauxNeat: async () => ({joursRenseignes: 0}), donneesSuffisantesNeat: () => false},
});
(async () => {
  assert.match((await getCoaiInsight('local-test')).texte, /apprend encore/);
  signals = {...base, checkinHebdo: {stress: null, energie: 3, douleurs: false}};
  let insight = await getCoaiInsight('local-test');
  assert.equal(insight.ton, 'neutral');
  assert.doesNotMatch(insight.texte, /continue comme ça/);
  assert.match(insight.texte, /bilan.*enregistré/i);
  signals = {...base, adherenceRepas: {total: 3, commePrevu: 3}};
  insight = await getCoaiInsight('local-test');
  assert.equal(insight.ton, 'neutral');
  assert.doesNotMatch(insight.texte, /bilan.*enregistré/i);
  signals = {...base, nombreSeancesRecentes: 2};
  assert.match((await getCoaiInsight('local-test')).texte, /2 séances/);
  signals = {...base, checkinHebdo: {stress: 5, semaineDebut: '2025-01-06'}};
  insight = await getCoaiInsight('local-test');
  assert.match(insight.texte, /06\/01\/2025/);
  assert.doesNotMatch(insight.texte, /cette semaine|en ce moment/);
  assert.match(insight.texte, /actualis/i);
  signals.checkinHebdo.semaineDebut = 'not-a-date';
  insight = await getCoaiInsight('local-test');
  assert.match(insight.texte, /dernier bilan/);
  assert.doesNotMatch(insight.texte, /Invalid Date/);
  signals.checkinHebdo.semaineDebut = '2026-09-21';
  assert.match((await getCoaiInsight('local-test')).texte, /21\/09\/2026/);
  console.log('PASS insight: truthful empty-workout guidance, check-in acknowledgement, meal-only/workout cases, dated stress, invalid-date fallback. Simulated signals, no AI call.');
})().catch(error => {console.error(error); process.exitCode = 1;});
