const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.join(__dirname, '../src/lib/exercices/videos-coai.ts');
const exportsModule = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsModule });
const { videoCoaiPourNom: video } = exportsModule;
for (const nom of ['Kickback élastique', 'Kickback fessier élastique', 'Kickback triceps haltère', 'Traction guidée (machine)', 'Traction assistée', 'Assisted pull-up']) {
  assert.equal(video(nom), null, nom);
}
assert.equal(video('Kickback triceps à l’élastique').fichier, 'kickback-elastique');
assert.equal(video('Traction (barre fixe)').fichier, 'traction');
assert.equal(video('Traction supination').fichier, 'chin-up');
console.log('PASS: 9 correspondances vidéo sans confusion fessiers/triceps ou traction libre/assistée');
