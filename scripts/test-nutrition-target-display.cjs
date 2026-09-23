const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync('src/components/programme/anneaux-macros.tsx', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText;
const box = { exports: {}, require };
vm.runInNewContext(code, box);
const render = objectifsJournaliers => renderToStaticMarkup(React.createElement(box.exports.AnneauxMacros, { objectifsJournaliers }));
const html = render({ calories: '~2 000 à 2 500 kcal', proteines: '~120 à 160 g', glucides: '~220 à 300 g', lipides: '~65 à 85 g' });
for (const text of ['~2 000 à 2 500 kcal', '~120 à 160 g', '~220 à 300 g', '~65 à 85 g']) assert.ok(html.includes(text), text);
assert.ok(!html.includes('>2 kcal<'));
const numeric = render({ calories: 2000, proteines: '120', glucides: '220,5', lipides: 65 });
for (const text of ['2000 kcal', '120 g', '220,5 g', '65 g']) assert.ok(numeric.includes(text), text);
assert.equal(render(null), '');
assert.equal(render({ proteines: {}, calories: NaN }), '');
console.log('PASS: real component preserves ranges, units and approximations; numeric and invalid inputs covered.');
