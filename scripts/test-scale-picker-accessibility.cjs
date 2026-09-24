const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/components/ui/scale-picker.tsx', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022},
}).outputText;
const box = {exports: {}, require: name => {assert.equal(name, 'react/jsx-runtime'); return require(name);}};
vm.runInNewContext(code, box);
for (const selected of [null, 1, 2, 3, 4, 5]) {
  let changed;
  const tree = box.exports.ScalePicker({label: 'Stress', value: selected, onChange: n => {changed = n;}, labelMin: 'Faible', labelMax: 'Élevé'});
  const group = tree.props.children[0];
  assert.equal(group.props.role, 'group'); assert.equal(group.props['aria-label'], 'Stress');
  const buttons = group.props.children;
  assert.equal(buttons.length, 5);
  buttons.forEach((button, index) => {
    const n = index + 1;
    assert.equal(button.props.type, 'button');
    assert.match(button.props['aria-label'], new RegExp(`Stress : ${n} sur 5`));
    assert.equal(button.props['aria-pressed'], selected === n);
    assert.match(button.props.className, /min-h-11/); assert.match(button.props.className, /min-w-11/);
    button.props.onClick(); assert.equal(changed, n);
  });
  assert.match(buttons[0].props['aria-label'], /Faible/); assert.match(buttons[4].props['aria-label'], /Élevé/);
}
console.log('PASS scale picker: named group and values, selected state, unchanged 1–5 callbacks, minimum touch classes. Component tree, not VoiceOver/device proof.');
