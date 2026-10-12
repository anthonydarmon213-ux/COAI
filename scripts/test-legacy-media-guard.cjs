const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const cache = new Map();
let selectedData;
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020,
  }}).outputText;
  vm.runInNewContext(code, { exports, Date, require(name) {
    if (name === '@/lib/auth/server') return { getCurrentAppUser: async () => ({ id: 'fixture', profile: {} }) };
    if (name === '@/lib/db/client') return { prisma: { programmeGenerated: {
      findFirst: async () => ({ statut: 'VALIDE', contenu: selectedData }),
    } } };
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
function strings(tree) {
  if (typeof tree === 'string') return [tree];
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(strings);
  return strings(tree.props?.children);
}

const { exerciceAvecMediasCoai } = load(path.resolve('src/lib/exercices/media-coai.ts'));
const { EntrainementView } = load(path.resolve('src/components/programme/entrainement-view.tsx'));
const { SeanceDuJourHero } = load(path.resolve('src/components/programme/seance-du-jour-hero.tsx'));
assert.equal(exerciceAvecMediasCoai('Squat barre'), true);
assert.equal(exerciceAvecMediasCoai('Hip thrust barre'), false);

for (const exercices of [
  [{ nom: 'Squat barre' }, { nom: 'Hip thrust barre' }],
  [{ nom: 'Hip thrust barre' }],
  [],
  [null],
]) {
  const seance = { nom: 'Ancien programme', exercices };
  const data = { seances: [seance] };
  const original = JSON.stringify(data);
  const view = EntrainementView({ data });
  const week = nodes(view).find(node => node.props?.renderContenu);
  const details = nodes(week.props.renderContenu(seance));
  const hero = nodes(SeanceDuJourHero({ contenu: data, premiereSeance: true }));
  for (const tree of [details, hero]) {
    assert.equal(tree.filter(node => node.type === 'DemarrerSeanceButton').length, 0);
    assert.equal(tree.filter(node => node.type === 'ExerciceCard').length, 0);
  }
  assert(strings(hero).join(' ').includes('Séance à actualiser'));
  assert.equal(JSON.stringify(data), original, 'Le programme enregistré ne change pas.');
}

const complete = { seances: [{ nom: 'Séance filmée', exercices: [{ nom: 'Squat barre' }] }] };
const completeHero = nodes(SeanceDuJourHero({ contenu: complete, premiereSeance: true }));
assert.equal(completeHero.filter(node => node.type === 'DemarrerSeanceButton').length, 1,
  'Une séance entièrement filmée reste accessible.');

const sessionPage = load(path.resolve('src/app/(app)/programme/seance-du-jour/page.tsx')).default;
(async () => {
  selectedData = { seances: [{ nom: 'Ancienne séance', exercices: [{ nom: 'Squat barre' }, { nom: 'Hip thrust barre' }] }] };
  const original = JSON.stringify(selectedData);
  const tree = nodes(await sessionPage({ searchParams: { seance: '0' } }));
  for (const component of ['FicheSeance', 'FicheActions', 'DemarrerSeanceButton']) {
    assert.equal(tree.filter(node => node.type === component).length, 0, `${component} ne doit pas afficher une séance incomplète.`);
  }
  assert(strings(tree).join(' ').includes('Cette séance doit être actualisée'));
  assert.equal(JSON.stringify(selectedData), original);
  console.log('PASS: écran, fiche et lecteur bloquent les séances anciennes incomplètes ; séance filmée accessible ; données intactes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
