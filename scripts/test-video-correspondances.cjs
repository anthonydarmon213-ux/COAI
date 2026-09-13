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
for (const nom of ['Face pull', 'Face pull à la poulie basse', 'Face pull poulie haute', 'Face pull câble']) {
  assert.equal(video(nom), null, nom);
}
for (const nom of ['Face pull élastique', 'Face pull à l’élastique', 'Face pull avec élastique']) {
  assert.equal(video(nom).fichier, 'face-pull-elastique', nom);
}
console.log('PASS: 16 correspondances vidéo, dont face pull sans confusion poulie/élastique');
