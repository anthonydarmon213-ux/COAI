// Release audit, not a green unit test. Reads real catalogue and JSON overrides.
// Exits 1 if any supported training programme has an incomplete media mapping.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, process, console,
    require: name => name.startsWith('@/') ? load(path.join(root, 'src', name.slice(2) + '.ts')) : require(name),
  });
  return exports;
}
const { toutesLesClesEntrainement } = load(path.join(root, 'src/lib/programmes-socles/cle.ts'));
const { construireSocleEntrainement } = load(path.join(root, 'src/lib/programmes-socles/catalogue.ts'));
const { exerciceBibliothequePourNom } = load(path.join(root, 'src/lib/exercices/media-coai.ts'));
const { photoCoaiPourNom } = load(path.join(root, 'src/lib/exercices/photos-coai.ts'));
const { videoCoaiPourNom, urlVideoCoai } = load(path.join(root, 'src/lib/exercices/videos-coai.ts'));
const failures = [];
let total = 0, complete = 0;
for (const key of toutesLesClesEntrainement()) {
  const override = path.join(root, 'src/lib/programmes-socles/data/entrainement', key + '.json');
  for (const duration of [45, 60]) {
    total++;
    let programme;
    try { programme = fs.existsSync(override) ? JSON.parse(fs.readFileSync(override, 'utf8')) : construireSocleEntrainement(key, duration); }
    catch { failures.push({ key, duration, reason: 'unreadable-programme' }); continue; }
    const before = failures.length;
    if (!Array.isArray(programme.seances) || !programme.seances.length) failures.push({ key, duration, reason: 'no-sessions' });
    for (const [session, seance] of (programme.seances || []).entries()) {
      if (!Array.isArray(seance.exercices) || !seance.exercices.length) failures.push({ key, duration, session, reason: 'no-exercises' });
      for (const exercice of seance.exercices || []) {
        const name = typeof exercice.nom === 'string' ? exercice.nom : '';
        const canonical = exerciceBibliothequePourNom(name);
        const photo = photoCoaiPourNom(canonical?.nom ?? name);
        const video = videoCoaiPourNom(canonical?.nom ?? name);
        const reasons = [];
        if (!canonical) reasons.push('name-not-in-catalogue');
        if (!photo) reasons.push('no-exact-photo');
        else if (!fs.existsSync(path.join(root, 'public', photo))) reasons.push('photo-file-missing');
        if (!video) reasons.push('no-exact-video');
        else if (!fs.existsSync(path.join(root, 'public', urlVideoCoai(video.fichier)))) reasons.push('video-file-missing');
        if (reasons.length) failures.push({ key, duration, session: session + 1, name, reasons });
      }
    }
    if (failures.length === before) complete++;
  }
}
const movements = [...new Set(failures.map(f => f.name).filter(Boolean))].map(name => ({ name,
  reasons: [...new Set(failures.filter(f => f.name === name).flatMap(f => f.reasons))],
}));
console.log(JSON.stringify({ total, complete, incomplete: total - complete, movements,
  ...(process.argv.includes('--details') ? { failures } : { failureCount: failures.length }),
}, null, 2));
process.exitCode = failures.length ? 1 : 0;
