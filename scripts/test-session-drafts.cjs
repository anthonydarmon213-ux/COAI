const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const storage = new Map();
const context = vm.createContext({ exports: {}, window: { localStorage: {
  getItem: k => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: k => storage.delete(k),
}}, isPlainObject: v => v !== null && typeof v === 'object' && !Array.isArray(v) });
function run(code) {
  return vm.runInContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, context);
}
run(fs.readFileSync('src/lib/programmes/draft-key.ts', 'utf8'));
run(source.slice(source.indexOf('const EXPIRATION_H'), source.indexOf('export function SeanceRunner')));
const key = context.exports.sessionDraftKey;
const a = key('user-a', 'Full body', [{ nom: 'Presse', series: 3 }]);
const b = key('user-a', 'Full body', [{ nom: 'Presse', series: 4 }]);
const other = key('user-b', 'Full body', [{ nom: 'Presse', series: 3 }]);
assert.notEqual(a, b); assert.notEqual(a, other); assert.equal(key(undefined, 'Test', []), null);
const draft = { nomSeance: 'Full body', debut: Date.now(), index: 2, realise: { '0': { reps: '10', charge: '20' } } };
storage.set(a, JSON.stringify(draft));
storage.set('coai:seance-en-cours', JSON.stringify(draft));
Object.assign(context, { cleBrouillon: b, nomSeance: 'Full body', debut: Date.now(), index: 0, realise: {}, substitutions: {}, seanceCondensee: false, nomsRealises: {}, repos: undefined });
const write = source.match(/window\.localStorage\.setItem\(\s*cleBrouillon,[\s\S]*?\n      \);/);
assert.ok(write, 'tester l’écriture réelle du lecteur');
run(write[0]);
context.a = a; context.b = b; context.other = other;
assert.equal(run("lireSauvegarde('Full body', a).realise['0'].charge"), '20');
assert.equal(run("lireSauvegarde('Full body', b).index"), 0);
assert.equal(run("lireSauvegarde('Full body', other)"), null);
run('effacerSauvegarde(b)');
assert.ok(storage.has(a)); assert.ok(!storage.has(b));
assert.ok(storage.has('coai:seance-en-cours'), 'ancien brouillon conservé sans attribution automatique');
storage.set(b, JSON.stringify({ ...draft, debut: Date.now() - 9 * 3600000 }));
assert.equal(run("lireSauvegarde('Full body', b)"), null);
assert.ok(storage.has(a));
console.log('PASS : isolation compte/prescription, reprise des charges, suppression ciblée, expiration, ancien brouillon préservé');
