const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const box = { exports: {}, require };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/ui/select.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
for (const [children, expected] of [
  ['Simple', 'Simple'], [['Force', ' — ', 'Développé couché'], 'Force — Développé couché'],
  [['Durée : ', 45, ' min'], 'Durée : 45 min'], [null, 'VALUE'],
]) {
  const html = renderToStaticMarkup(React.createElement(box.exports.Select, { value: 'VALUE' }, React.createElement('option', { value: 'VALUE' }, children)));
  assert(html.includes(expected), html);
}
console.log('PASS: simple, composite and numeric option labels plus empty fallback');
