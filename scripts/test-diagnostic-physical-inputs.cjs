const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/diagnostic/physical-inputs.ts', 'utf8');
const box = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
} }).outputText, box);
const errors = box.exports.physicalInputErrors;
for (const [age, height, weight] of [['35','178','75'], ['120','300','400'], ['1','0.1','0.1'], ['35','178.5','75.4'], ['','','']]) {
  assert(Object.values(errors(age,height,weight)).every(value => value === null));
}
for (const bad of ['0','-1','121','35.5','Infinity','NaN','abc']) assert(errors(bad,'178','75').age);
for (const bad of ['0','-1','301','Infinity','NaN','abc']) assert(errors('35',bad,'75').height);
for (const bad of ['0','-1','401','Infinity','NaN','abc']) assert(errors('35','178',bad).weight);
const quiz=fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx','utf8');
assert.match(quiz, /!Object.values\(physicalInputErrors\(age, tailleCm, poidsKg\)\).some\(Boolean\)/);
assert.match(quiz, /id="diagnostic-physical-errors" aria-live="polite"/);
console.log('PASS diagnostic numeric input bounds, decimals, integer age, invalid values and accessible validation wiring. Pure function, not device UI.');
