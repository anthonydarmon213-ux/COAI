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
let ageChronologique = 40;
let profileOverride;
function Gauge() {}
const page = load('src/app/(app)/suivi/progression/page.tsx', name => {
  if (name === 'react/jsx-runtime') return require(name);
  if (name.endsWith('/auth/server')) return { getCurrentAppUser: async () => ({ id: 'test-only', profile: profileOverride === undefined ? { age: ageChronologique } : profileOverride }) };
  if (name.endsWith('/db/client')) return { prisma: {
    mesure: { findMany: async () => [] }, seanceLog: { findMany: async () => [] },
    dailySession: { findMany: async args => { assert.equal(args.where.userId, 'test-only'); assert(args.where.date.gte); return dailies; } },
  } };
  if (name.endsWith('/age-coai')) return engine;
  if (name.endsWith('/volume-musculaire')) return { volumeParMuscle: () => ({ intensites: {}, volumes: {}, nbSeances: 0 }) };
  if (name.endsWith('/subscription/plan')) return { getEffectivePlan: () => null };
  if (name.endsWith('/gauge')) return { Gauge };
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
  }
  console.log('PASS: 8 score availability scenarios and 4 missing/partial profile scenarios');
})().catch(error => { console.error(error); process.exitCode = 1; });
