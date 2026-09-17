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
