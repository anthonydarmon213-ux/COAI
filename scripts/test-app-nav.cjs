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
for(const [route,label] of [['/suivi/repcount','RepCount'],['/programme/recettes','Nutrition'],['/suivi/alimentation','Nutrition'],['/programme/evolution','Progression'],['/programme/recuperation','Récupération']]) {
  pathname=route;
  const html=renderToStaticMarkup(React.createElement(api.AppNav));
  const desktop=html.split('aria-label="Navigation principale"')[1].split('</nav>')[0];
  assert.equal((desktop.match(/coai-nav-actif/g)||[]).length,1,route);
  assert.ok(html.includes(`· ${label}`),route);
  assert.ok(html.includes('href="/programme/exercices"') || label!=='Entraînement');
  for(const target of ['/coach','/club','/compte/profil','/compte/parametres','/videos']) assert.ok(html.includes(`href="${target}"`));
  const quick=html.split('aria-label="Accès rapides"')[1].split('</nav>')[0];
  assert.equal((quick.match(/href=/g)||[]).length,3);
}
console.log('PASS navigation: 3 quick links, all sections retained, unique active section, nutrition/progression routes');
