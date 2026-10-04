const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// The server boundary must remount the quiz when the authenticated identity
// changes, otherwise its in-memory answers could be saved under the new owner.
const page = fs.readFileSync('src/app/(marketing)/diagnostic/page.tsx', 'utf8');
const pageAst = ts.createSourceFile('page.tsx', page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let quizKey;
function visitPage(node) {
  if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageAst) === 'DiagnosticQuiz') {
    quizKey = node.attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.text === 'key');
  }
  ts.forEachChild(node, visitPage);
}
visitPage(pageAst);
assert(quizKey && ts.isJsxExpression(quizKey.initializer), 'Quiz needs an authenticated-identity key');
const keyExpression = quizKey.initializer.expression.getText(pageAst);
const keys = [null, {id: 'owner-a'}, {id: 'owner-b'}].map(user => vm.runInNewContext(keyExpression, {user}));
assert.equal(new Set(keys).size, 3, 'Anonymous, A and B must never share quiz state');
const source = fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx', 'utf8');
const ast = ts.createSourceFile('quiz.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const effects = []; let resume; let createAccount;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect') effects.push(node.arguments[0]);
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'resumeDiagnostic') resume = node;
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'handleCreerCompte') createAccount = node;
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
assert.equal(saved.ownerId, 'fixture-owner');
assert(saved.expiresAt > Date.now());
for (const step of ['profilPhysique', 'niveau', 'sante']) {
  run(`(${saveEffect.getText(ast)})()`, {...box, step});
  assert.equal(saved.step, step);
  assert.equal(saved.ownerId, 'fixture-owner', 'Intermediate answers belong to the same account');
  assert(saved.expiresAt > Date.now());
}
run(`(${saveEffect.getText(ast)})()`, {...box, step: 'niveau', connecte: false, diagnosticOwnerId: null});
assert.equal(saved.ownerId, null, 'Anonymous answers remain explicitly anonymous');
run(`(${saveEffect.getText(ast)})()`, box);
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
assert(createAccount, 'Account creation handler must exist');
for (const blocked of [false, true]) {
  let transferred = 0;
  const writes = [];
  assert.doesNotThrow(() => run(createAccount.getText(ast) + '\nhandleCreerCompte();', {
    email: 'fixture@example.test',
    reponsesEnProfil: () => ({age: 39}),
    storeDiagnosticAnswers: (answers, email) => {
      assert.equal(answers.age, 39);
      assert.equal(email, 'fixture@example.test');
      transferred++;
    },
    window: {localStorage: {setItem(key, value) {
      if (blocked) throw new Error('Storage denied');
      writes.push([key, value]);
    }}},
  }), 'Optional dashboard marker must never interrupt account creation');
  assert.equal(transferred, 1);
  assert.deepEqual(writes, blocked ? [] : [['coai_dashboard_intro_pending', '1']]);
}
console.log('PASS actual account creation handler: optional storage failure tolerated; diagnostic transfer still attempted.');
