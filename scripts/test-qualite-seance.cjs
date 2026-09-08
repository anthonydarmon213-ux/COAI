const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,
    {exports, require: name => name.startsWith('@/') ? load(path.join(root,'src',name.slice(2)+'.ts')) : require(name)});
  return exports;
}
const {verifierQualiteSeance: check} = load(path.join(root,'src/lib/programmes/qualite-seance.ts'));
const {EXERCICES} = load(path.join(root,'src/lib/exercices/catalogue.ts'));
const {exerciceAvecMediasCoai} = load(path.join(root,'src/lib/exercices/media-coai.ts'));
const nom = EXERCICES.find(e => exerciceAvecMediasCoai(e.nom)).nom;
const valid = () => ({nom:'Séance test',echauffement:'Mobilité douce',retourAuCalme:'Retour progressif',exercices:[{nom,series:3,repetitions:'8-10',repos:'60 sec',charge:'Effort modéré',methode:'Série classique'}]});
assert.equal(check(valid()).erreurs.length,0);
for (const key of ['nom','echauffement','retourAuCalme']) {const s=valid();delete s[key];assert.ok(check(s).erreurs.length);}
for (const key of ['series','repetitions','repos','charge','methode']) {const s=valid();delete s.exercices[0][key];assert.ok(check(s).erreurs.length);}
assert.ok(check({...valid(),exercices:[]}).erreurs.length);
assert.ok(check({...valid(),exercices:[{...valid().exercices[0],nom:'Exercice inventé'}]}).erreurs.length);
assert.ok(check(null).erreurs.length);
console.log('PASS: 12 contrôles de complétude, catalogue réel chargé');
