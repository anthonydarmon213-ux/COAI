const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
let pathname='/suivi/repcount';
const api={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/app-nav.tsx','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}
}).outputText,{exports:api,require:name=>{
  if(name==='next/navigation')return {usePathname:()=>pathname};
  if(name==='next/link')return {default:({children,...props})=>React.createElement('a',props,children)};
  if(name==='@/components/brand/coai-mark')return {CoaiMark:()=>null};
  if(name==='@/components/compte/sign-out-button')return {SignOutButton:()=>null};
  return require(name);
}});
for(const [route,label,primary] of [
  ['/suivi/repcount','RepCount','/suivi/progression'],
  ['/programme/recettes','Nutrition','/programme/entrainement'],
  ['/suivi/alimentation','Nutrition','/suivi/progression'],
  ['/programme/evolution','Progression','/suivi/progression'],
  ['/programme/recuperation','Récupération','/programme/entrainement'],
]) {
  pathname=route;
  const html=renderToStaticMarkup(React.createElement(api.AppNav));
  const desktop=html.split('aria-label="Navigation principale"')[1].split('</nav>')[0];
  // Current simplified navigation exposes its state semantically, not through
  // the removed coai-nav-actif class or the retired three-link quick bar.
  assert.equal((desktop.match(/aria-current="page"/g)||[]).length,1,route);
  assert.ok(desktop.includes(`href="${primary}" aria-current="page"`),route);
  assert.equal((desktop.match(/href=/g)||[]).length,4);
  assert.ok(html.includes(`· ${label}`),route);
  assert.ok(html.includes('href="/programme/exercices"') || label!=='Entraînement');
  for(const target of ['/coach','/club','/compte/profil','/compte/parametres','/videos']) assert.ok(html.includes(`href="${target}"`));
  assert.ok(html.includes('aria-label="Toutes les rubriques"'));
  assert.ok(html.includes('Explorer'));
}
console.log('PASS navigation: four primary destinations, unique aria-current, full explorer retained, nutrition/progression routes');
