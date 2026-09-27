const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const states = [];
let cursor = 0;
const trigger = { current: null };
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
  },
  useMemo: fn => fn(),
  useRef: () => trigger,
};
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, require(name) {
    if (name === 'react') return hooks;
    if (name.startsWith('@/lib/')) return load('src/' + name.slice(2) + '.ts');
    if (name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => key });
    return require(name);
  } });
  return exports;
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const { ExerciceCatalogue } = load('src/components/exercices/exercice-catalogue.tsx');
let tree;
function render() { cursor = 0; tree = nodes(ExerciceCatalogue()); }
const panel = () => tree.find(n => n.props?.id === 'filtres-exercices');
const toggle = () => tree.find(n => n.props?.['aria-controls'] === 'filtres-exercices');
const button = label => tree.find(n => n.type === 'button' && n.props.children === label);
const count = () => tree.find(n => n.props?.role === 'status').props.children;
render();
const allCount = count();
assert.equal(panel().props.hidden, true);
assert.equal(toggle().props['aria-expanded'], false);
assert(!tree.some(n => n.props?.titre === 'Groupe musculaire'));
toggle().props.onClick(); render();
assert.equal(panel().props.hidden, false);
tree.find(n => n.props?.titre === 'Groupe musculaire').props.onToggle('DOS'); render();
assert(nodes(toggle()).some(n => n.props?.children === 'Filtres · 1 actif'));
const selectedCount = count();
assert.notEqual(selectedCount, allCount);
let focused = false;
trigger.current = { focus() { focused = true; } };
button('Voir les résultats').props.onClick(); render();
assert.equal(focused, true);
assert.equal(panel().props.hidden, true);
assert.equal(count(), selectedCount, 'Replier ne supprime pas la sélection');
toggle().props.onClick(); render();
assert.deepEqual(Array.from(tree.find(n => n.props?.titre === 'Groupe musculaire').props.actifs), ['DOS']);
button('Tout réinitialiser').props.onClick(); render();
assert.equal(count(), allCount);
tree.find(n => n.type === 'input').props.onChange({ target: { value: 'Gainage planche' } }); render();
assert.equal(count(), '1 exercice correspondant.');
assert.equal(button('Tout réinitialiser'), undefined, 'Pas de doublon avec Effacer la recherche quand aucun filtre actif');
let prevented = false, blurred = false;
tree.find(n => n.type === 'form').props.onSubmit({ preventDefault() { prevented = true; }, currentTarget: { querySelector() { return { blur() { blurred = true; } }; } } });
assert(prevented && blurred, 'Soumission sans navigation et fermeture du clavier');
button('Effacer la recherche').props.onClick(); render();
assert.equal(count(), allCount);
console.log('PASS catalogue: filtres repliés, sélection conservée, compteur actif, retour focus, réinitialisation et recherche sans navigation');
