const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
let values, cursor;
const box = { exports: {}, require: n => n === 'react' ? { useState: () => [values[cursor++], () => {}], useMemo: f => f() } : n === 'react/jsx-runtime' ? require(n) : new Proxy({}, { get: () => 'div' }) };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/marketing/calculateur-calories-form.tsx','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, box);
function text(n) { if (Array.isArray(n)) return n.map(text).join(''); if (n?.props) return text(n.props.children); return typeof n === 'string' || typeof n === 'number' ? String(n) : ''; }
for (const [age, height, weight, valid] of [
  ['30','170','70',true], ['30','170','70.5',true], ['30','170','-70',false],
  ['-30','170','70',false], ['30','-170','70',false], ['30','170','0',false],
  ['','170','70',false], ['30','170','Infinity',false], ['30','170','NaN',false],
  ['10000','170','70',false],
]) {
  values = ['Femme',age,height,weight,'1.375','0',true]; cursor = 0;
  const rendered = text(box.exports.CalculateurCaloriesForm());
  assert.equal(rendered.includes('Ton résultat'), valid);
  assert.equal(rendered.includes('Vérifie ton âge'), !valid);
}
console.log('PASS: calculator rejects nonpositive/nonfinite inputs and invalid output; valid decimals preserved');
