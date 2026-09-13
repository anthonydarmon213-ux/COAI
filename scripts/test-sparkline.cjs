const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const exportsModule = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/suivi/sparkline.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: exportsModule,
  require(name) {
    if (name === 'react/jsx-runtime') return require(name);
    if (name.endsWith('/card')) return { Card: ({ children }) => React.createElement('div', null, children) };
    if (name.endsWith('/section-label')) return { SectionLabel: ({ children }) => React.createElement('span', null, children) };
    throw new Error(name);
  },
});
const render = points => renderToStaticMarkup(React.createElement(exportsModule.Sparkline, { label: 'Poids', points, unite: 'kg' }));
assert.match(render([]), /Aucun relevé/);
assert.doesNotMatch(render([]), /Premier relevé|undefined|<svg/);
assert.match(render([50]), /Premier relevé enregistré/);
assert.doesNotMatch(render([50]), /prochaine séance|<svg/);
assert.match(render([50, 51]), /<svg/);
assert.doesNotMatch(render([50, 51]), /Premier relevé|Aucun relevé/);
console.log('PASS: sparkline empty, first measurement and trend states');
