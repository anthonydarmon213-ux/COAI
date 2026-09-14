const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let destination, reloads = 0;
const browser = { location: { pathname: '/programme/seance-du-jour', search: '?seance=2',
  reload: () => reloads++, assign: value => { destination = value; } } };
function load(path, dependencies) {
  const box = { exports: {}, window: browser, require: name => {
    assert(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, box);
  return box.exports;
}
const jsx = { 'react/jsx-runtime': require('react/jsx-runtime') };
const { AccessRecovery } = load('src/components/auth/access-recovery.tsx', jsx);
const tree = AccessRecovery();
const buttons = React.Children.toArray(tree.props.children).filter(child => child.type === 'button');
assert.equal(buttons.length, 2);
buttons[0].props.onClick(); assert.equal(reloads, 1);
buttons[1].props.onClick();
assert.equal(destination, '/completer-inscription?redirect_to=%2Fprogramme%2Fseance-du-jour%3Fseance%3D2');
assert(renderToStaticMarkup(tree).includes('Retrouvons ton espace.'));
const { default: ErrorPage } = load('src/app/(app)/error.tsx', jsx);
let resets = 0;
const errorTree = ErrorPage({ reset: () => resets++ });
React.Children.toArray(errorTree.props.children).find(child => child.type === 'button').props.onClick();
assert.equal(resets, 1);
assert(renderToStaticMarkup(errorTree).includes('Cette page n’a pas pu se charger.'));
const pages = ['compte/parametres','compte/abonnement','compte/profil','fonctionnalites','avis',
  'suivi/seances','videos','suivi/progression','suivi/tests-maxi','suivi/mesures','coach',
  'suivi/alimentation','bienvenue','programme/evolution','programme/seance-du-jour'];
for (const page of pages) {
  const source = fs.readFileSync(`src/app/(app)/${page}/page.tsx`, 'utf8');
  assert(source.includes('if (!user) return <AccessRecovery />;'), page);
  assert(!source.includes('if (!user) return null;'), page);
}
console.log('PASS: recovery rendering, reload, preserved route/query, error reset, all 15 page guards. No network or account writes.');
