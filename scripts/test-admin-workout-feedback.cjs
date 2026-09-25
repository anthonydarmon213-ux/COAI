// Real JSX fragment; isolated data, no database or external calls.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const source = fs.readFileSync('src/app/admin/clients/[id]/page.tsx', 'utf8');
assert(source.includes('workoutHistory(client.id, { take: 5 })'));
assert(!source.includes('prisma.seanceLog.findMany'));
assert(source.indexOf('if (!admin?.isAdmin)') < source.indexOf('workoutHistory(client.id'));
const fragment = source.slice(source.indexOf('{seancesRecentes.map((s) => (') + 1,
  source.indexOf('\n            </Card>', source.indexOf('{seancesRecentes.map((s) => ('))).trim();
assert(fragment.endsWith('}'));
const code = ts.transpileModule('exports.render = (seancesRecentes) => <>{' + fragment.slice(0,-1) + '}</>;', {
  compilerOptions: {module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX},
}).outputText;
const box = {exports:{}, require, Badge:({children}) => React.createElement('span',null,children)};
vm.runInNewContext(code,box);
function render(extra) { return renderToStaticMarkup(box.exports.render([{
  id:'fixture',date:new Date('2026-09-25T12:00:00Z'),...extra,
}])); }
const daily = render({dailyTitle:'Séance locale',dailyRating:'BIEN_DOSEE',dailyPain:true});
assert(daily.includes('Séance locale'));assert(daily.includes('Bien dosée'));
assert(daily.includes('intensité non précisée'));assert(!daily.includes('/5'));
assert(!render({dailyPain:false}).includes('Douleur'));
assert(!render({dailyPain:null}).includes('Douleur'));
assert(render({difficulte:3,energie:4,douleur:'IMPORTANTE',douleurZone:'Dos'}).includes('Difficulté 3/5'));
assert(render({dailyRating:'TROP_FACILE'}).includes('Trop facile'));
assert(render({dailyRating:'TROP_DURE'}).includes('Trop dure'));
console.log('PASS admin feedback JSX: daily title/rating/pain without invented intensity; legacy metrics preserved; admin guard precedes history. Not connected UI.');
