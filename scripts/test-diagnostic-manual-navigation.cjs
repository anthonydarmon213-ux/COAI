const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx', 'utf8');
const ast = ts.createSourceFile('quiz.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
let directResult;
let transition, analysisEffect;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'chooseSingle') handler = node;
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'showCompleteResult') directResult = node;
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'goToStep') transition = node;
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect' && node.arguments[0]?.getText(ast).includes('const dureeTotale = 3000')) analysisEffect = node.arguments[0];
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

assert.ok(transition);assert.ok(analysisEffect);
const changes=[];
const transitionBox={setAnalyseIndex:v=>changes.push(['index',v]),setAnalyseProgress:v=>changes.push(['progress',v]),setRevealIndex:v=>changes.push(['reveal',v]),setStep:v=>changes.push(['step',v])};
vm.runInNewContext(ts.transpileModule(transition.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,transitionBox);
vm.runInNewContext('goToStep("analyse")',transitionBox);
assert.deepEqual(changes,[['index',0],['progress',0],['step','analyse']]);
changes.length=0;vm.runInNewContext('goToStep("reveal")',transitionBox);
assert.deepEqual(changes,[['reveal',0],['step','reveal']]);
changes.length=0;vm.runInNewContext('goToStep("niveau")',transitionBox);
assert.deepEqual(changes,[['step','niveau']]);
let counter=0;
const timers=new Map();
const timerBox={...transitionBox,step:'analyse',ANALYSE_MESSAGES:['A','B','C'],Date,
  setInterval:(fn,delay)=>{timers.set(++counter,{fn,delay});return counter;},
  setTimeout:(fn,delay)=>{timers.set(++counter,{fn,delay});return counter;},
  clearInterval:id=>timers.delete(id),clearTimeout:id=>timers.delete(id)};
const effect=vm.runInNewContext(ts.transpileModule(`(${analysisEffect.getText(ast)})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,timerBox);
changes.length=0;const cancel=effect();
assert.equal(changes.length,0,'No synchronous resets inside effect');
assert.equal(timers.size,3);
const advance=[...timers.values()].find(timer=>timer.delay===3250);assert.ok(advance);
advance.fn();assert.deepEqual(changes,[['reveal',0],['step','reveal']]);
cancel();assert.equal(timers.size,0,'Leaving analysis cancels every timer');
timerBox.step='niveau';assert.equal(effect(),undefined);assert.equal(timers.size,0);
console.log('PASS diagnostic transitions: resets before navigation, scheduled reveal, no reset effect, timer cleanup. Clock/timers simulated.');
