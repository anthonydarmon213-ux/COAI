const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
let contenu;
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020,
  }}).outputText, { exports, Date, require(name) {
    if (name === '@/lib/auth/server') return { getCurrentAppUser: async () => ({ id: 'fixture', profile: {} }) };
    if (name === '@/lib/db/client') return { prisma: { programmeGenerated: { findFirst: async () => ({ statut: 'VALIDE', contenu }) } } };
    if (name.startsWith('@/lib/')) return load(path.resolve('src', name.slice(2) + '.ts'));
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
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
const page = load(path.resolve('src/app/(app)/programme/seance-du-jour/page.tsx')).default;
(async () => {
  for (const exercices of [[{ nom: 'Hip thrust barre' }, { nom: 'Leg curl allongé', series: 3 }], [{ nom: 'Hip thrust barre' }], [null], []]) {
    contenu = { seances: [{ nom: 'Historique', exercices }] };
    const original = JSON.stringify(contenu);
    const tree = nodes(await page({ searchParams: Promise.resolve({ seance: '0', visuels: 'femme' }) }));
    const expected = exercices.some(e => e?.nom === 'Leg curl allongé') ? ['Leg curl (machine)'] : [];
    for (const type of ['FicheSeance', 'DemarrerSeanceButton', 'FicheActions']) {
      const component = tree.find(n => n.type === type);
      assert.equal(Boolean(component), Boolean(expected.length));
      if (component) assert.deepEqual(Array.from(component.props.exercices ?? component.props.story.exercices, e => e.nom), expected);
    }
    if (!expected.length) assert(tree.some(n => n.props?.href === '/programme/exercices'));
    assert.equal(JSON.stringify(contenu), original);
  }
  console.log('PASS: fiche, partage et lancement utilisent les mêmes médias ; séance vide sans export ni lecteur ; source intacte');
})().catch(error => { console.error(error); process.exitCode = 1; });
