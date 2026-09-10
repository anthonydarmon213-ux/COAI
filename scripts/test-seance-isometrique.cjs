const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app/api/seances/route.ts'), 'utf8');
const schemaSource = source.slice(source.indexOf('const setSchema'), source.indexOf('const bodySchema'));
const context = { z: require('zod').z };
vm.runInNewContext(ts.transpileModule(schemaSource + '\nglobalThis.schema = setSchema;', { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context);
const maintien = context.schema.parse({set: 1, reps: 0, charge: 0, dureeSecondes: 30});
assert.equal(maintien.dureeSecondes, 30, 'Le serveur doit conserver le maintien');
assert.equal(maintien.reps * maintien.charge, 0, 'Pas de tonnage fictif');
assert.equal(maintien.reps, 0, 'Les secondes ne sont pas des répétitions');
for (const dureeSecondes of [-1, 0, 1.5, 3601, '30']) {
  assert.equal(context.schema.safeParse({set: 1, reps: 0, charge: 0, dureeSecondes}).success, false);
}
assert.equal(context.schema.safeParse({set: 1, reps: 10, charge: 20}).success, true, 'Anciennes séries compatibles');
console.log('PASS: maintien conservé, métriques sans répétitions fictives, 5 durées invalides refusées, anciennes séries compatibles');
