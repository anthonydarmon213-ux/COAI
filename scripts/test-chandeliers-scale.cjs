const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const component = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../src/components/suivi/chandeliers-charges.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: component, require });
for (const charge of [0, 20, 12.5, 1e308, Number.MAX_VALUE]) {
  const html = renderToStaticMarkup(React.createElement(component.ChandeliersCharges, {
    historique: [{ date: new Date('2026-09-30'), sets: [{ reps: 1, charge }],
      volume: charge, meilleureSerie: { reps: 1, charge } }],
  }));
  assert.ok(!/NaN|Infinity/.test(html), `Non-finite scale for ${charge}`);
  assert.ok(html.includes(`Série 1 : 1 × ${charge} kg`), 'Original charge preserved');
  for (const match of html.matchAll(/(?:y1|y2|y|cy)="([^"]+)"/g)) {
    const y = Number(match[1]);
    assert.ok(Number.isFinite(y) && y >= 0 && y <= 205, `Invalid SVG coordinate ${y}`);
  }
}
console.log('PASS charge chart: finite SVG scale, zero/decimal/extreme charges, original values preserved. Server render only.');
