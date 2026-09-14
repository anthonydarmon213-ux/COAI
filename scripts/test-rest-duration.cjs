const fs = require('fs'), vm = require('vm'), ts = require('typescript'), assert = require('node:assert/strict');
const React = require('react');
const state = []; let cursor = 0, value = 90;
const loaded = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/suivi/rest-duration.tsx', 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText, { module: loaded, exports: loaded.exports, require: name => name === 'react' ? {
  useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], v => { state[i] = v; }]; },
} : require(name) });
function nodes(node) { if (!node || typeof node !== 'object') return []; return [node, ...React.Children.toArray(node.props?.children).flatMap(nodes)]; }
function render() { cursor = 0; return nodes(loaded.exports.RestDuration({ value, onChange: n => { value = n; } })); }
function custom(m, s) {
  render().find(n => n.type === 'select').props.onChange({ target: { value: 'custom' } });
  const inputs = render().filter(n => n.type === 'input');
  inputs[0].props.onChange({ target: { value: m } }); inputs[1].props.onChange({ target: { value: s } });
  render().find(n => n.type === 'button' && n.props.children === 'Appliquer').props.onClick();
}
custom('1', '15'); assert.equal(value, 75);
custom('1', '40'); assert.equal(value, 100);
assert(render().some(n => n.type === 'option' && n.props.value === 100));
for (const [m,s] of [['0','0'],['-1','20'],['1','60'],['61','0'],['','0'],['1.5','0']]) {
  custom(m,s); assert.equal(value, 100); assert(render().some(n => n.props?.role === 'alert'));
}
render().find(n => n.type === 'button' && n.props.children === 'Annuler').props.onClick(); assert.equal(value,100);
custom('60','0'); assert.equal(value,3600);
custom('0','1'); assert.equal(value,1);
render().find(n=>n.type==='select').props.onChange({ target: { value:'90' } }); assert.equal(value,90);
console.log('Repos : saisie exacte, restauration valeur personnalisée, validation, annulation et présélections — OK');
