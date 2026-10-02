const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx', 'utf8');
const ast = ts.createSourceFile('quiz.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const effects = []; let resume;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect') effects.push(node.arguments[0]);
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'resumeDiagnostic') resume = node;
  ts.forEachChild(node, visit);
}
visit(ast);
const resultEffect = effects.find(node => node.getText(ast).includes('diagnostic_result_viewed'));
const saveEffect = effects.find(node => node.getText(ast).includes('saveDiagnosticProgress('));
assert(resultEffect && saveEffect && resume);
const run = (code, box) => vm.runInNewContext(ts.transpileModule(code, {
  compilerOptions: {target: ts.ScriptTarget.ES2022},
}).outputText, box);
for (const connected of [true, false]) {
  let cleared = 0;
  run(`(${resultEffect.getText(ast)})()`, {
    step: 'result', connecte: connected, clearDiagnosticProgress: () => cleared++, trackFunnelEvent: () => {},
  });
  assert.equal(cleared, connected ? 0 : 1, 'Do not discard an unsaved connected result');
}
let saved;
const box = { step: 'result', connecte: true, diagnosticOwnerId: 'fixture-owner', saveDiagnosticProgress: value => { saved = value; } };
function collect(node) {
  if (ts.isShorthandPropertyAssignment(node)) box[node.name.text] ??= '';
  ts.forEachChild(node, collect);
}
collect(saveEffect);
box.age = '35'; box.niveau = 'Débutant';
run(`(${saveEffect.getText(ast)})()`, box);
assert.equal(saved?.step, 'result'); assert.equal(saved.age, '35');
let restored, destination;
const resumeBox = {
  diagnosticOwnerId: 'fixture-owner',
  connecte: true, questionSteps: ['profilPhysique', 'niveau'], readDiagnosticProgress: () => saved,
  applySavedProgress: value => { restored = value; }, trackFunnelEvent: () => {},
  setStep: value => { destination = value; }, startDiagnostic: () => assert.fail('Unexpected restart'),
};
run(resume.getText(ast) + '\nresumeDiagnostic();', resumeBox);
assert.equal(restored.age, '35'); assert.equal(destination, 'result');
assert.match(source, /connecte && savedStep === "result"/);
console.log('PASS actual diagnostic effects: connected result retained, anonymous flow unchanged, answers restored directly to result. Storage/browser simulated.');
