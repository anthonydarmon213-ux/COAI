const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const source = fs.readFileSync('src/components/programme/programme-purchase-button.tsx', 'utf8');
const options = {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022};
for (const environment of [null, false, true]) {
  const box = {exports: {}, require(id) {
    if (id === 'react') return {...React, useSyncExternalStore: () => environment};
    if (id === '@/lib/analytics/consent') return {isNativeIOSApp: () => environment === true};
    if (id === '@/lib/programmes-prets/offre') return {OFFRE_RENTREE_LABEL: 'OFFRE WEB', PROGRAMME_UNITAIRE_PRIX_LABEL: '19 €'};
    return require(id);
  }};
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: options}).outputText, box);
  const html = renderToStaticMarkup(React.createElement(box.exports.ProgrammePurchaseButton, {
    programmePrincipal: {slug: 'test', nom: 'Test'}, choixOfferts: [{slug: 'bonus', nom: 'Bonus'}], connecte: true,
  }));
  if (environment === false) {
    assert(html.includes('Acheter ce programme'));
    assert(html.includes('19 €'));
    assert(html.includes('<select'));
  } else {
    assert(!html.includes('19 €'));
    assert(!html.includes('<select'));
    assert(!html.includes('Acheter ce programme'));
    if (environment === true) assert(html.includes('href="/compte/abonnement"'));
    else assert(html.includes('role="status"'));
  }
}
const ast = ts.createSourceFile('purchase.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'acheter') handler = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast); assert(handler);
// A stale native button must stop before touching any state or issuing fetch.
const guard = {isNativeIOSApp: () => true};
vm.runInNewContext(ts.transpileModule(handler, {compilerOptions: options}).outputText, guard);
Promise.resolve(vm.runInNewContext('acheter()', guard)).then(() => console.log('PASS web/native/SSR purchase presentation and native dispatch guard')).catch(error => {console.error(error); process.exitCode = 1;});
