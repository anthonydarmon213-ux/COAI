const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports });
  return exports;
}
const { EXERCICES } = load('src/lib/exercices/catalogue.ts');
const { photoCoaiPourNom } = load('src/lib/exercices/photos-coai.ts');
const { videoCoaiPourNom } = load('src/lib/exercices/videos-coai.ts');
const { variantesPourExercice } = load('src/lib/exercices/variantes.ts');
for (const [names, file] of [
  [['Développé incliné haltères', 'Développé incliné (haltères)', 'developpe incline halteres', 'Incline dumbbell press'], 'developpe-incline-halteres'],
  [['Développé incliné barre', 'Développé incliné (barre)', 'Incline barbell press'], 'developpe-incline-barre'],
  [['Développé incliné machine', 'Développé incliné (machine)', 'Incline chest press machine'], 'developpe-incline-machine'],
]) {
  for (const name of names) assert.equal(photoCoaiPourNom(name), `/exercices/${file}.jpg`, name);
  assert(fs.existsSync(`public/exercices/${file}.jpg`));
}
for (const name of ['Développé incliné', 'Incline press']) assert.equal(photoCoaiPourNom(name), null, 'No equipment guess');
assert.equal(photoCoaiPourNom('Curl ischio TRX'), '/exercices/suspension-curl-ischio.jpg');
assert.equal(photoCoaiPourNom('Ischio suspension'), '/exercices/suspension-curl-ischio.jpg');
assert.equal(photoCoaiPourNom('Étirement ischio'), '/exercices/mobilite-etirement-ischio-debout-banc.jpg');
assert.equal(photoCoaiPourNom('Ischio'), null);
assert.equal(photoCoaiPourNom('Leg curl (machine)'), '/exercices/leg-curl-allonge.jpg');
for (const nom of ['Goblet squat', 'Squat gobelet (kettlebell)', 'Rowing élastique', 'Rowing à l’élastique', 'Développé militaire haltères', 'Dumbbell shoulder press']) {
  assert.equal(videoCoaiPourNom(nom), null, `Média non conforme : ${nom}`);
}
for (const nom of ['Tirage horizontal poitrine appuyée (chest supported row)', 'Rowing poitrine appuyée', 'Chest-supported row']) {
  assert.equal(photoCoaiPourNom(nom), null, nom);
  assert.equal(videoCoaiPourNom(nom), null, nom);
}
for (const nom of ['Étirement assis écarté', 'Pec deck', 'Butterfly']) assert.equal(photoCoaiPourNom(nom), null, nom);
assert(videoCoaiPourNom('Tirage horizontal (machine)'));
assert.equal(videoCoaiPourNom('Tirage horizontal prise large machine à leviers'), null);
assert(photoCoaiPourNom('Écarté haltères'));
assert(videoCoaiPourNom('Tirage horizontal à la poulie'));
assert(!EXERCICES.some(ex => /hip[ -]?thr?ust/i.test(ex.nom)));
for (const ex of EXERCICES) {
  assert(!variantesPourExercice(ex.nom).some(v => /hip[ -]?thr?ust/i.test(v.nom)));
}
const visibles = EXERCICES.filter(ex => photoCoaiPourNom(ex.nom) && videoCoaiPourNom(ex.nom));
assert(visibles.length > 0);
for (const ex of visibles) {
  assert(fs.existsSync('public' + photoCoaiPourNom(ex.nom)), ex.nom);
}
assert(fs.readFileSync('src/components/exercices/exercice-catalogue.tsx', 'utf8').includes('if (!photoCoaiPourNom(ex.nom) || !videoCoaiPourNom(ex.nom)) return false;'));
console.log(`PASS: hip thrust absent du catalogue et des variantes ; ${visibles.length} exercices avec photo et vidéo référencées.`);
