const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx', 'utf8');
const ast = ts.createSourceFile('quiz.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
let directResult;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'chooseSingle') handler = node;
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'showCompleteResult') directResult = node;
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(handler, 'Actual single-choice handler must exist');
const calls = [];
const box = {
  setter: value => calls.push(value),
  goNext: () => assert.fail('Selection must not navigate'),
  setStep: () => assert.fail('Selection must not change step'),
  window: {setTimeout: () => assert.fail('No deferred navigation')},
  setTimeout: () => assert.fail('No deferred navigation'),
};
vm.runInNewContext(ts.transpileModule(handler.getText(ast), {
  compilerOptions: {target: ts.ScriptTarget.ES2022},
}).outputText + '\nchooseSingle(setter, "Débutant"); chooseSingle(setter, "Intermédiaire");', box);
assert.deepEqual(calls, ['Débutant', 'Intermédiaire']);
assert.match(source, /onClick=\{step === lastQuestionStep \? finishQuestions : goNext\}/);
assert.ok(directResult);
const transitions=[];
const reveal={step:'reveal',diagnostic:{fixture:true},setStep:value=>transitions.push(value)};
vm.runInNewContext(ts.transpileModule(directResult.getText(ast),{
  compilerOptions:{target:ts.ScriptTarget.ES2022},
}).outputText,reveal);
vm.runInNewContext('showCompleteResult()',reveal);
assert.deepEqual(transitions,['result']);
reveal.step='email'; vm.runInNewContext('showCompleteResult()',reveal);
reveal.step='reveal'; reveal.diagnostic=null; vm.runInNewContext('showCompleteResult()',reveal);
assert.deepEqual(transitions,['result'],'No bypass before completion or without result');
assert.match(source,/type="button" onClick=\{showCompleteResult\}/);
assert.doesNotMatch(source,/Touche l&apos;écran pour continuer/);
console.log('PASS direct result: available after calculation only; real button and no click-anywhere instruction');
console.log('PASS actual chooseSingle: selection and correction without timer/navigation; explicit Continue wired');
console.log('LIMIT: isolated handler regression, not full browser journey');
