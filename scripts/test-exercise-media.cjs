const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: name => name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts') : require(name) });
  return exports;
}
const { EXERCICES } = load('src/lib/exercices/catalogue.ts');
const { photoCoaiPourNom } = load('src/lib/exercices/photos-coai.ts');
const { videoCoaiPourNom, urlVideoCoai, urlPosterVideoCoai } = load('src/lib/exercices/videos-coai.ts');
const { variantesPourExercice } = load('src/lib/exercices/variantes.ts');
const { filtrerExercicesAvecMedias, programmeAvecMediasCoai } = load('src/lib/exercices/media-coai.ts');
const stored = { seances: [{ nom: 'Séance conservée', exercices: [
  { nom: 'Rowing haltère unilatéral', series: '3' },
  { nom: 'Gainage planche', repetitions: '30 sec' },
] }] };
const before = JSON.stringify(stored);
assert.deepEqual(Array.from(filtrerExercicesAvecMedias(stored.seances[0].exercices), e => e.nom), ['Gainage planche']);
assert.deepEqual(Array.from(programmeAvecMediasCoai(stored).seances[0].exercices, e => e.nom), ['Gainage planche']);
assert.equal(JSON.stringify(stored), before, 'Le filtrage séance/export ne réécrit pas le programme sauvegardé');
for (const name of ['Développé incliné machine', 'Développé incliné (machine)', 'Développé incliné à la machine', 'Développé incliné barre', 'Développé couché incliné', 'Développé couché incliné haltères', 'Incline bench press', 'Incline dumbbell press', 'Incline chest press machine']) {
  assert.equal(videoCoaiPourNom(name), null, `Aucune substitution épaules, Smith ou banc plat : ${name}`);
}
assert.equal(videoCoaiPourNom('Pompes inclinées')?.fichier, 'pompes-inclinees');
for (const name of ['Rowing haltère unilatéral', 'Rowing haltères unilatéral', 'One arm dumbbell row', 'One-arm dumbbell row', 'Single arm dumbbell row', 'Rowing haltère unilatéral (bent over row)']) {
  assert.equal(videoCoaiPourNom(name), null, `Pas de vidéo deux pieds au sol pour la fiche genou sur banc : ${name}`);
}
assert.equal(videoCoaiPourNom('Rowing haltères')?.fichier, 'rowing-halteres', 'Préserver le rowing bilatéral');
assert.equal(videoCoaiPourNom('Développé Arnold')?.fichier, 'developpe-arnold', 'Rotation confirmée dans le clip');
for (const name of ['Deadlift roumain', 'Deadlift roumain barre', 'Soulevé de terre roumain à la barre', 'Romanian deadlift', 'RDL', 'Soulevé de terre roumain haltères', 'Deadlift roumain haltères', 'RDL haltères']) {
  assert.equal(videoCoaiPourNom(name), null, `Le rush mal nommé montre un rowing : ${name}`);
}
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
for (const name of ['Leg curl allongé', 'Leg curl allongé (machine)', 'Leg curl (machine)']) {
  assert.equal(photoCoaiPourNom(name), '/exercices/leg-curl-allonge.jpg');
  assert.equal(videoCoaiPourNom(name)?.fichier, 'leg-curl-machine');
}
for (const name of ['Leg curl assis', 'Seated leg curl', 'Leg curl debout', 'Leg curl unilatéral', 'Leg curl allongé unilatéral']) {
  assert.equal(photoCoaiPourNom(name), null, name);
  assert.equal(videoCoaiPourNom(name), null, name);
}
assert.equal(EXERCICES.find(ex => ex.id === 'leg-curl-machine').freeExerciseDbId, undefined, 'No seated external fallback for lying media');
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
  const video = videoCoaiPourNom(ex.nom);
  for (const url of [photoCoaiPourNom(ex.nom), urlVideoCoai(video.fichier), urlPosterVideoCoai(video.fichier)]) {
    const file = 'public' + url;
    assert(fs.existsSync(file), `${ex.nom}: fichier manquant ${url}`);
    assert(fs.statSync(file).isFile() && fs.statSync(file).size > 0, `${ex.nom}: fichier vide ou invalide ${url}`);
  }
}
assert(fs.readFileSync('src/components/exercices/exercice-catalogue.tsx', 'utf8').includes('if (!photoCoaiPourNom(ex.nom) || !videoCoaiPourNom(ex.nom)) return false;'));
console.log(`PASS: hip thrust absent du catalogue et des variantes ; ${visibles.length} exercices avec photo, vidéo et poster locaux non vides. Ne prouve pas la correspondance visuelle de chaque mouvement.`);
