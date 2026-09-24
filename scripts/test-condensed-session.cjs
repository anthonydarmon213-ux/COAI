// Real condensed-session selector; no browser, account or external calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const ast = ts.createSourceFile('runner.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let selector;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'steps' &&
      node.initializer && ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(ast) === 'useMemo') selector = node.initializer.arguments[0].getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast); assert.ok(selector);
function select(tousLesSteps, seanceCondensee) {
  const code = ts.transpileModule(`(${selector})()`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return vm.runInNewContext(code, { tousLesSteps, seanceCondensee });
}
for (let count = 1; count <= 8; count++) {
  const original = [{ type: 'echauffement', texte: 'préparation' }];
  for (let i = 0; i < count; i++) for (let s = 1; s <= 3; s++) {
    original.push({ type: 'set', exerciceIndex: i, nom: `Exercice ${i}`, setIndex: s });
    if (s < 3 || i < count - 1) original.push({ type: 'repos', secondes: 60 + i, prochainNom: s < 3 ? `Exercice ${i}` : `Exercice ${i + 1}` });
  }
  original.push({ type: 'calme', texte: 'retour' });
  const before = JSON.stringify(original);
  assert.equal(select(original, false), original);
  const condensed = select(original, true);
  const expectedIndices = Array.from({ length: count }, (_, i) => i).filter(i => i === 0 || i % 2 === 1).slice(0, Math.max(2, Math.ceil(count / 2)));
  assert.equal(JSON.stringify([...new Set(condensed.filter(s => s.type === 'set').map(s => s.exerciceIndex))]), JSON.stringify(expectedIndices));
  assert.equal(condensed[0].type, 'echauffement');
  assert.equal(condensed.at(-1).type, 'calme');
  for (let j = 0; j < condensed.length; j++) if (condensed[j].type === 'repos') {
    assert.equal(condensed[j - 1]?.type, 'set', 'No rest for an omitted exercise');
    assert.equal(condensed[j + 1]?.type, 'set', 'No consecutive or trailing rest');
    assert.equal(condensed[j].prochainNom, condensed[j + 1].nom, 'Announce the actual next exercise');
    assert.equal(condensed[j].secondes, 60 + condensed[j - 1].exerciceIndex);
  }
  assert.equal(JSON.stringify(original), before, 'Do not mutate the full programme');
}
console.log('PASS: condensed sessions 1–8 exercises retain selected sets, correct rests/names and full-session source.');
