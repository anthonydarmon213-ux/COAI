const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020,
  }}).outputText, { exports, Date, require(name) {
    if (name.startsWith('@/lib/')) return load(path.resolve('src', name.slice(2) + '.ts'));
    if (name === 'react/jsx-runtime') return require(name);
    return new Proxy({}, { get: (_, key) => key });
  }});
  return exports;
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const { EntrainementView } = load(path.resolve('src/components/programme/entrainement-view.tsx'));
const { SeanceDuJourHero } = load(path.resolve('src/components/programme/seance-du-jour-hero.tsx'));
for (const entries of [
  [{ nom: 'Hip thrust barre' }, { nom: 'Bird dog' }, { nom: 'Leg curl allongé', series: 3 }],
  [{ nom: 'Hip thrust barre' }], [], [null, 42],
]) {
  const seance = { nom: 'Ancienne séance', exercices: entries };
  const data = { seances: [seance] };
  const before = JSON.stringify(data);
  const root = EntrainementView({ data });
  const plan = nodes(root).find(n => n.props?.renderContenu);
  const detail = nodes(plan.props.renderContenu(seance));
  const hero = nodes(SeanceDuJourHero({ contenu: data, premiereSeance: true }));
  const expected = entries.some(e => e?.nom === 'Leg curl allongé') ? ['Leg curl (machine)'] : [];
  assert.deepEqual(detail.filter(n => n.type === 'ExerciceCard').map(n => n.props.exercice.nom), expected);
  for (const tree of [detail, hero]) {
    const buttons = tree.filter(n => n.type === 'DemarrerSeanceButton');
    assert.equal(buttons.length, expected.length ? 1 : 0);
    if (buttons.length) assert.deepEqual(Array.from(buttons[0].props.exercices, e => e.nom), expected);
    else assert(tree.some(n => n.props?.href === '/programme/exercices'));
  }
  assert.equal(JSON.stringify(data), before, 'Le programme enregistré ne doit pas être modifié');
}
console.log('PASS: anciens programmes filtrés, cartes/hero/lecteur cohérents, état vide et données préservées');
