const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
function load(file, requireModule) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: requireModule });
  return exports;
}
const engine = load('src/lib/insight/age-coai.ts');
let dailies = [];
let seances = [];
let ageChronologique = 40;
let profileOverride;
function Gauge() {}
const page = load('src/app/(app)/suivi/progression/page.tsx', name => {
  if (name === 'react/jsx-runtime') return require(name);
  if (name.endsWith('/auth/server')) return { getCurrentAppUser: async () => ({ id: 'test-only', profile: profileOverride === undefined ? { age: ageChronologique } : profileOverride }) };
  if (name.endsWith('/db/client')) return { prisma: {
    mesure: { findMany: async () => [] }, seanceLog: { findMany: async () => seances },
    dailySession: { findMany: async args => { assert.equal(args.where.userId, 'test-only'); assert(args.where.date.gte); return dailies; } },
  } };
  if (name.endsWith('/age-coai')) return engine;
  if (name.endsWith('/suivi/workout-history')) return {workoutHistory: async (id, options) => {
    assert.equal(id, 'test-only'); assert.equal(options.order, 'asc'); return seances;
  }};
  if (name.endsWith('/suivi/progression-force')) return load('src/lib/suivi/progression-force.ts');
  if (name.endsWith('/server/request-time')) return { requestTime: () => Date.now() };
  if (name.endsWith('/volume-musculaire')) return load('src/lib/suivi/volume-musculaire.ts', dependency => {
    assert.equal(dependency, '@/lib/exercices/muscles');
    return load('src/lib/exercices/muscles.ts');
  });
  if (name.endsWith('/subscription/plan')) return { getEffectivePlan: () => null };
  if (name.endsWith('/gauge')) return { Gauge };
  assert.ok(name.startsWith('@/components/') || name === 'next/link', `Unexpected dependency: ${name}`);
  return new Proxy({}, { get: () => ({ children }) => React.createElement('div', null, children) });
}).default;
function gauges(node, result = []) {
  if (Array.isArray(node)) node.forEach(n => gauges(n, result));
  else if (node && typeof node === 'object') {
    if (node.type === Gauge) result.push(node.props);
    gauges(node.props?.children, result);
  }
  return result;
}
(async () => {
  for (const days of [0, 2, 3, 7]) {
    for (const age of [null, 40]) {
      ageChronologique = age;
      dailies = Array.from({ length: days }, () => ({ sleep: 'BON', energy: 'NORMALE', workoutRating: 'BIEN_DOSEE', pain: false, completedAt: new Date() }));
      const expected = engine.calculerAgeCoai({ ageChronologique, dailies });
      const result = gauges(await page());
      assert.equal(result.find(g => g.label === 'Score COAI').displayValue, expected.disponible ? `${expected.score}/100` : '—');
      assert.equal(result.find(g => g.label === 'Âge COAI').displayValue, expected.disponible && expected.age.disponible ? `${expected.age.ageCoai} ans` : '—');
      assert(!result.some(g => g.sublabel === 'analyse en cours'));
    }
  }
  for (const [profile, nutrition, recovery] of [
    [null, 0, 0], [{}, 0, 0],
    [{ habitudesAlimentaires: null, hydratation: '', qualiteSommeil: '   ' }, 0, 0],
    [{ consommationCafe: 0, qualiteSommeil: 'bonne' }, 17, 25],
  ]) {
    profileOverride = profile;
    const result = gauges(await page());
    assert.equal(result.find(g => g.label === 'Alimentation').percent, nutrition);
    assert.equal(result.find(g => g.label === 'Récupération').percent, recovery);
    const sleep = result.find(g => g.label === 'Sommeil');
    assert.equal(sleep.displayValue, profile?.qualiteSommeil === 'bonne' ? undefined : '—');
    assert.equal(sleep.sublabel, profile?.qualiteSommeil === 'bonne' ? 'qualité déclarée' : 'à renseigner');
  }
  console.log('PASS: 8 score availability scenarios and 4 missing/partial profile scenarios');
  seances = [{date:new Date(),exercices:[null,{nom:42},{nom:'Squat',sets:[null,{reps:10,charge:20}]}]}];
  assert.ok(gauges(await page()).length,'malformed historical exercises must not crash progression');
  const source = fs.readFileSync('src/app/(app)/suivi/progression/page.tsx','utf8');
  const block = source.slice(source.indexOf('  type SetDetail'),source.indexOf('  const graphiquesForce'));
  const context = {seances:[{exercices:[
    null, {nom:42}, {nom:' '},
    {nom:'Squat',sets:[null,{reps:10,charge:20},{reps:-10,charge:40},{reps:'8',charge:20},{reps:Infinity,charge:20},{reps:1e308,charge:1e308}]},
    {nom:'Legacy',series:3,repetitions:8,chargeKg:10},
    {nom:'Invalid',sets:'bad'}, {nom:'Invalid',chargeKg:20,series:-1},
  ]}], progressionForce:()=>new Map()};
  vm.runInNewContext(ts.transpileModule(block+'\nglobalThis.total = tonnageParSeance; globalThis.byExercise=[...tonnageParExercice];',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
  assert.equal(JSON.stringify(context.total),'[440]');
  assert.equal(JSON.stringify(context.byExercise),'[["Squat",[200]],["Legacy",[240]]]');
  console.log('PASS: malformed historical page, valid tonnage preserved, invalid/negative/overflow values excluded');
})().catch(error => { console.error(error); process.exitCode = 1; });
