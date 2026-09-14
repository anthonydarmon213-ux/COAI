const fs = require('fs'), ts = require('typescript'), vm = require('vm'), assert = require('node:assert/strict');
const loaded = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/exercices/search.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module: loaded, exports: loaded.exports });
const { matchesExerciseSearch: matches } = loaded.exports;
assert(matches('Développé couché (haltères)', 'developpe halteres'));
assert(matches('Développé couché (haltères)', 'HALTÈRES développé'));
assert(matches('Presse à cuisses · Machine guidée', 'presse machine'));
assert(matches('Extension d’épaule', "d'epaule"));
assert(matches('Presse', '  '));
assert(!matches('Presse à cuisses', 'tirage'));
assert(!matches('Développé couché barre', 'couche halteres'));
const source = fs.readFileSync('src/components/exercices/exercice-catalogue.tsx', 'utf8');
assert(source.includes('aria-pressed={actifs.includes(o)}'));
assert(source.includes('setQuery(""); setGroupes([]); setMateriels([]); setTypes([])'));
console.log('Recherche : accents, casse, mots cumulés, matériel, non-correspondances et remise à zéro — OK');
