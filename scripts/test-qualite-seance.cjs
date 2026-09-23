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
const {exerciceAvecMediasCoai, exerciceBibliothequePourNom, filtrerExercicesAvecMedias} = load(path.join(root,'src/lib/exercices/media-coai.ts'));
for (const [alias, canonical] of [
  ['Face pull à l’élastique', 'Face pull élastique'],
  ["Face pull à l'élastique", 'Face pull élastique'],
  ['Abduction de hanche à l’élastique', 'Abduction de hanche élastique'],
  ['Dips aux barres parallèles', 'Dips'],
  ['Leg curl allongé', 'Leg curl (machine)'],
]) assert.equal(exerciceBibliothequePourNom(alias)?.nom, canonical);
for (const name of ['Face pull à la poulie', 'Abduction de hanche machine', 'Dips sur anneaux']) {
  assert.equal(exerciceBibliothequePourNom(name), null, 'No neighbouring equipment alias');
}
assert.equal(exerciceBibliothequePourNom('Dips sur banc (triceps)')?.nom, 'Dips sur banc (triceps)');
assert.equal(exerciceAvecMediasCoai('Abduction de hanche à l’élastique'), false, 'Alias must not fabricate a missing video');
assert.equal(filtrerExercicesAvecMedias([{nom:'Face pull à l’élastique',series:3}])[0]?.nom, 'Face pull élastique');
const nom = EXERCICES.find(e => exerciceAvecMediasCoai(e.nom)).nom;
const valid = () => ({nom:'Séance test',echauffement:'Mobilité douce',retourAuCalme:'Retour progressif',exercices:[{nom,series:3,repetitions:'8-10',repos:'60 sec',charge:'Effort modéré',methode:'Série classique'}]});
assert.equal(check(valid()).erreurs.length,0);
for (const key of ['nom','echauffement','retourAuCalme']) {const s=valid();delete s[key];assert.ok(check(s).erreurs.length);}
for (const key of ['series','repetitions','repos','charge','methode']) {const s=valid();delete s.exercices[0][key];assert.ok(check(s).erreurs.length);}
assert.ok(check({...valid(),exercices:[]}).erreurs.length);
assert.ok(check({...valid(),exercices:[{...valid().exercices[0],nom:'Exercice inventé'}]}).erreurs.length);
assert.ok(check(null).erreurs.length);
for (const [key,value] of [['series',-3],['series',0],['series',2.5],['repetitions','0-10'],['repos','-60 sec'],['repos',Infinity],['series','−3']]) {
  const s=valid();s.exercices[0][key]=value;assert.ok(check(s).erreurs.length, `${key}: ${value}`);
}
const sansRepos=valid();sansRepos.exercices[0].repos='0 sec';assert.equal(check(sansRepos).erreurs.length,0);
console.log('PASS: 20 contrôles de complétude, catalogue réel chargé');
