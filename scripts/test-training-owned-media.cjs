const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');
const exportsView = {};
const source = fs.readFileSync('src/components/programme/entrainement-view.tsx', 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
}}).outputText, { exports: exportsView, require(name) {
  if (name === 'react/jsx-runtime') return jsx;
  if (name.endsWith('photos-coai')) return { photoCoaiPourNom: nom => nom === 'COAI fixture' ? '/exercices/fixture.jpg' : null };
  return new Proxy({}, { get: (_, key) => key });
}});
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
for (const [nom, expected] of [['Sans média', null], ['COAI fixture', '/exercices/fixture.jpg']]) {
  const seance = { nom: 'Test', photoQuerySeance: 'stock', exercices: [{ nom }] };
  const root = exportsView.EntrainementView({ data: { seances: [seance] }, photosParExercice: { stock: 'https://images.pexels.com/forbidden.jpg' } });
  const plan = nodes(root).find(node => node.props?.renderContenu);
  const images = nodes(plan.props.renderContenu(seance)).filter(node => node.type === 'img');
  assert.equal(images.length, expected ? 1 : 0);
  if (expected) assert.equal(images[0].props.src, expected);
}
assert(!fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8').includes('photosParExercice?.['));
assert(fs.readFileSync('src/components/programme/pilier-page.tsx', 'utf8').includes('PILIERS[index] !== "ENTRAINEMENT" && index === indexPilierActif'));
console.log('PASS: séance sans média sans photo stock ; média COAI conservé ; lecteur et chargement entraînement sans repli stock.');
