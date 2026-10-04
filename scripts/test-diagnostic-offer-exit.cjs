const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx', 'utf8');
const ast = ts.createSourceFile('quiz.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let condition;
function visit(node) {
  if (ts.isConditionalExpression(node) && node.whenTrue.getText(ast).includes('Voir les accompagnements →')) {
    condition = node.condition.getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert(condition, 'Find the actual secondary offer link condition');
function visible(overrides = {}) {
  return vm.runInNewContext(condition, {connecte: true, accesProgrammeActif: false,
    verificationAccesIndisponible: false, applyStatus: 'idle', applyNeedsFormule: false,
    applyNeedsReview: false, ...overrides});
}
assert.equal(visible(), true, 'Keep the requested bottom offer exit before saving');
assert.equal(visible({applyStatus: 'erreur', applyNeedsFormule: true}), false,
  'The actionable save result already links to pricing: no adjacent duplicate');
assert.equal(visible({applyStatus: 'erreur', applyNeedsFormule: true, applyNeedsReview: true}), true,
  'Coach review replaces the primary offer link, so the bottom exit is not a duplicate');
for (const state of [{connecte: false}, {accesProgrammeActif: true}, {verificationAccesIndisponible: true}]) {
  assert.equal(visible(state), false);
}
assert.equal(visible({applyStatus: 'erreur'}), true, 'Unrelated save errors do not remove the offer exit');
console.log('PASS diagnostic offer exit: actual render condition, duplicate suppressed, original access states preserved');
