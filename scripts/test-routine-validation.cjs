// Execute the actual creation handler with mocked transport; never writes data.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
let states, cursor, calls;
const box = { exports: {}, fetch: async () => { calls++; return { ok: false, json: async () => ({}) }; },
  require: name => name === 'react' ? {
    useEffect: () => {},
    useState: init => { const i = cursor++; if (!(i in states)) states[i] = init; return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }]; },
  } : name.startsWith('@/') ? { Card: 'section', Button: 'button', Input: 'input', SectionLabel: 'span' } : require(name),
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/suivi/routines-panel.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
function render() { cursor = 0; return box.exports.RoutinesPanel({ onUtiliser: () => {} }); }
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const match = find(child, predicate); if (match) return match; }
}
(async () => {
  for (const series of [0, -1, 1.5, 21]) {
    states = [[], false, true, 'Routine test', [{ nom: 'Presse', series }], null, false]; calls = 0;
    await find(render(), n => n.props?.children === 'Enregistrer la routine').props.onClick();
    assert.equal(calls, 0);
    assert.match(find(render(), n => n.props?.role === 'alert').props.children, /entre 1 et 20/);
    assert.equal(states[4][0].series, series, 'preserve draft');
  }
  for (const series of [1, 3, 20, undefined]) {
    states = [[], false, true, 'Routine test', [{ nom: 'Presse', series }], null, false]; calls = 0;
    await find(render(), n => n.props?.children === 'Enregistrer la routine').props.onClick();
    assert.equal(calls, 1);
  }
  console.log('PASS: routine series bounds, integers, optional default and draft preservation. Transport mocked.');
})().catch(e => { console.error(e); process.exitCode = 1; });
