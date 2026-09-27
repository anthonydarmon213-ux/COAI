// Render the real components and their local dependencies. No network or database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const cache = new Map();
function load(name) {
  if (!name.startsWith('@/')) return require(name);
  if (cache.has(name)) return cache.get(name).exports;
  const base = 'src/' + name.slice(2);
  const file = ['.tsx', '.ts'].map(ext => base + ext).find(fs.existsSync);
  assert.ok(file, name);
  const box = { exports: {}, require: dependency => load(dependency.startsWith('.')
    ? '@/' + path.posix.normalize(path.posix.join(path.posix.dirname(name.slice(2)), dependency))
    : dependency) };
  cache.set(name, box);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(code, box, { filename: file });
  return box.exports;
}
const { RecuperationView } = load('@/components/programme/recuperation-view');
const { NutritionView } = load('@/components/programme/nutrition-view');
const render = (component, data) => renderToStaticMarkup(React.createElement(component, { data }));
const day = { jour: 'Lundi', type: 'Routine locale', sommeil: 'Conseil sommeil existant' };
const protocol = { nom: 'Protocole local', conseil: 'Conseil récupération existant' };
const meal = { jour: 'Lundi', repas: [{ nom: 'Repas local', quantite: 'Portion existante' }] };
const habit = { sujet: 'Habitude locale', conseil: 'Conseil nutrition existant' };
for (const invalid of [null, 17, 'entrée interrompue', []]) {
  const recovery = render(RecuperationView, { jours: [invalid, day], protocoles: [invalid, protocol] });
  assert.ok(recovery.includes('Conseil sommeil existant'));
  assert.ok(recovery.includes('Conseil récupération existant'));
  assert.ok(recovery.includes('incomplètes'));
  const nutrition = render(NutritionView, { jours: [invalid, meal], conseilsHabitudes: [invalid, habit] });
  assert.ok(nutrition.includes('Repas local'));
  assert.ok(nutrition.includes('Conseil nutrition existant'));
  assert.ok(nutrition.includes('incomplètes'));
}
assert.ok(!render(RecuperationView, { jours: [day], protocoles: [protocol] }).includes('incomplètes'));
assert.ok(!render(NutritionView, { jours: [meal], conseilsHabitudes: [habit] }).includes('incomplètes'));
console.log('PASS real nutrition/recovery render: incomplete list entries do not crash, valid content preserved, warning shown only when needed.');
