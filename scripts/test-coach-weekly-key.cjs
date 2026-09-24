const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const source = fs.readFileSync('src/app/(app)/coach/page.tsx', 'utf8');
const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let expression, legacy = '';
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'debutDeSemaine') legacy = node.getText(ast);
  if (ts.isPropertyAssignment(node) && node.name.getText(ast) === 'semaineDebut') expression = node.initializer.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast); assert.ok(expression);
const compile = code => ts.transpileModule(code, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
for (const now of ['2026-09-24T12:00:00Z', '2026-01-05T12:00:00Z', '2026-03-29T12:00:00Z', '2026-10-25T12:00:00Z']) {
  class Clock extends Date { constructor(value) { super(value === undefined ? now : value); } }
  const box = {exports: {}, Date: Clock};
  vm.runInNewContext(compile(fs.readFileSync('src/lib/checkin/semaine.ts', 'utf8')), box);
  box.lundiDeSemaine = box.exports.lundiDeSemaine;
  const expected = box.lundiDeSemaine(new Clock()).toISOString();
  const actual = vm.runInNewContext(compile(legacy + '\n' + expression), box).toISOString();
  assert.equal(actual, expected, `Coach query must use the stored API week key at ${now}, TZ=${process.env.TZ}`);
}
console.log(`PASS coach week lookup agrees with saved API key in ${process.env.TZ || 'system timezone'}, winter/summer/DST boundaries.`);
