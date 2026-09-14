const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/programmes/repos.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject });
for (const [input, expected] of [
  ['100 sec', '1 min 40 s'], ['90 sec', '1 min 30 s'],
  ['75 secondes', '1 min 15 s'], ['60 s', '1 min'], ['45 sec', '45 s'],
  ['120 secondes', '2 min'], ['1 min 15 s', '1 min 15 s'],
  ['60–90 sec', '60–90 sec'], ['selon les sensations', 'selon les sensations'],
]) assert.equal(exportsObject.formatRepos(input), expected);
const source = fs.readFileSync('src/components/programme/exercice-card.tsx', 'utf8');
assert.match(source, /cle === "repos" \? formatRepos\(String\(valeur\)\) : String\(valeur\)/);
console.log('Repos : conversion d’affichage et conservation des consignes vérifiées.');
