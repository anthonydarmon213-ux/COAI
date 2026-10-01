// Actual catalogue, filters and card rendering. No nutrition/medical validation.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = {exports:{}}; cache.set(filename,loadedModule);
  const code = ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{
    module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX, target:ts.ScriptTarget.ES2022,
  }}).outputText;
  vm.runInNewContext(code,{exports:loadedModule.exports,module:loadedModule,require(name){
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    const base = name.startsWith('@/') ? path.resolve('src',name.slice(2)) : path.resolve(path.dirname(filename),name);
    return load(['.ts','.tsx'].map(ext=>base+ext).find(file=>fs.existsSync(file)));
  }});
  return loadedModule.exports;
}
const {RECETTES,filtrerRecettes,TYPE_REPAS_LABEL,OBJECTIF_RECETTE_LABEL,REGIME_LABEL}=load('src/lib/nutrition/recettes.ts');
const {RecetteCard}=load('src/components/nutrition/recette-card.tsx');
const snapshot=JSON.stringify(RECETTES);
assert.equal(new Set(RECETTES.map(r=>r.slug)).size,RECETTES.length,'unique recipe slugs');
let images=0;
for (const recipe of RECETTES) {
  assert.ok(recipe.nom.trim() && recipe.description.trim(),recipe.slug);
  assert.ok(recipe.ingredients.length && recipe.ingredients.every(v=>typeof v==='string' && v.trim()),recipe.slug);
  assert.ok(recipe.etapes.length && recipe.etapes.every(v=>typeof v==='string' && v.trim()),recipe.slug);
  assert.ok(TYPE_REPAS_LABEL[recipe.typeRepas],recipe.slug);
  assert.ok(recipe.objectifs.every(v=>OBJECTIF_RECETTE_LABEL[v]),recipe.slug);
  assert.ok(recipe.regimes.every(v=>REGIME_LABEL[v]),recipe.slug);
  assert.ok(Number.isFinite(recipe.tempsMinutes) && recipe.tempsMinutes > 0,recipe.slug);
  for (const key of ['calories','proteines','glucides','lipides']) {
    assert.ok(Number.isFinite(recipe.macros[key]) && recipe.macros[key] >= 0,`${recipe.slug}: ${key}`);
  }
  if (recipe.photoLocale) {assert.ok(fs.existsSync('public'+recipe.photoLocale),recipe.slug);images++;}
  for (const photoUrl of [null,recipe.photoLocale ?? null]) {
    const html=renderToStaticMarkup(React.createElement(RecetteCard,{recette:recipe,photoUrl}));
    assert.ok(html.includes('<details') && html.includes('<summary') && html.includes('Ingrédients') && html.includes('Préparation'),recipe.slug);
    assert.ok(!html.includes('undefined') && !html.includes('NaN'),recipe.slug);
  }
}
let combinations=0;
for(const typeRepas of [undefined,...Object.keys(TYPE_REPAS_LABEL)])
for(const objectif of [undefined,...Object.keys(OBJECTIF_RECETTE_LABEL)])
for(const regime of [undefined,...Object.keys(REGIME_LABEL)]) {
  const expected=RECETTES.filter(r=>(!typeRepas||r.typeRepas===typeRepas)&&(!objectif||r.objectifs.includes(objectif))&&(!regime||r.regimes.includes(regime)));
  const actual=filtrerRecettes(RECETTES,{typeRepas,objectif,regime});
  assert.equal(JSON.stringify(actual.map(r=>r.slug)),JSON.stringify(expected.map(r=>r.slug)));
  combinations++;
}
assert.equal(JSON.stringify(RECETTES),snapshot,'render/filter must not mutate catalogue');
console.log(`PASS: ${RECETTES.length} cards with/without image, ${images} declared local images, unique slugs, ingredients/steps, ${combinations} filter combinations, no mutation.`);
console.log('LIMIT: not browser interaction, clinical/editorial accuracy, allergy verification, or photo-to-dish visual matching.');
