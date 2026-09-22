// Tests de rendu serveur : ne remplacent pas un contrôle visuel sur iPhone.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync('src/components/ui/gauge.tsx', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const loaded = { exports: {} };
vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports, require });
const render = (props) => renderToStaticMarkup(
  React.createElement(loaded.exports.Gauge, { label: 'Progression', ...props }),
);
for (const [percent, expected] of [
  [0, 0], [75, 75], [100, 100], [-5, 0], [120, 100],
  [NaN, 0], [Infinity, 0], [72.6, 73],
]) {
  const html = render({ percent });
  assert(html.includes(`${expected}%`));
  assert(!html.includes('NaN'));
  assert(!html.includes('spin_'));
  assert(html.includes('motion-safe:transition-'));
  assert(html.includes('aria-hidden="true"'));
}
assert(render({ percent: 50, displayValue: '5 / 10' }).includes('5 / 10'));
console.log('9 cas de rendu de jauge validés.');
