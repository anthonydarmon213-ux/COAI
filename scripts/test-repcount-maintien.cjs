const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsModule = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/suivi/historique-exercice.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsModule});
const {historiquePourExercice, historiqueParMesure, totalMaintien, formatSerie, comparerAvantApres} = exportsModule;
const log = (date, sets, nom='Gainage planche') => ({date,exercices:[{nom,sets}]});
const historique = historiquePourExercice([
  log('2026-09-10', [{reps:0,charge:0,dureeSecondes:30},{reps:0,charge:0,dureeSecondes:45}]),
  log('2026-09-03', [{reps:0,charge:0,dureeSecondes:20}]),
  log('2026-09-01', [{reps:10,charge:20}]),
  log('invalide', [{reps:10,charge:20}]),
  log('2026-09-02', [null,{},'invalide',{reps:Infinity,charge:20},{reps:0,charge:0,dureeSecondes:-3}]),
  log('2026-09-10', [{reps:10,charge:20}], 'Autre exercice'),
], 'gainage planche');
assert.equal(historique.length,3);
assert.equal(totalMaintien(historique[0].sets),75);
assert.equal(historique[0].volume,0);
assert.equal(historique[0].meilleureSerie.dureeSecondes,45);
assert.equal(historique[0].sets.reduce((total,s)=>total+s.reps,0),0);
assert.equal(formatSerie(historique[0].sets[0]),'30 s de maintien');
assert.equal(formatSerie(historique[2].sets[0]),'10 × 20 kg');
const maintien = historiqueParMesure(historique,true);
const repetitions = historiqueParMesure(historique,false);
assert.equal(maintien.length,2);
assert.equal(repetitions.length,1);
assert.equal(repetitions[0].volume,200);
const comparaison = comparerAvantApres(maintien,new Date('2026-09-10'));
assert.equal(totalMaintien(comparaison.precedente.sets),75);
assert.equal(totalMaintien(comparaison.ilYAUneSemaine.sets),20);
const mixte = historiquePourExercice([log('2026-09-10',[{reps:10,charge:20},{reps:0,charge:0,dureeSecondes:30}])],'Gainage planche');
assert.equal(historiqueParMesure(mixte,true)[0].volume,0);
assert.equal(historiqueParMesure(mixte,false)[0].meilleureSerie.reps,10);
assert.equal(historiqueParMesure(mixte,true)[0].meilleureSerie.dureeSecondes,30);
// Rendu serveur du composant réel avec données fictives injectées dans ses
// états. Complète les tests purs, sans prétendre tester les clics navigateur.
const React = require('react');
const stepper = {};
const session = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/suivi/repcount-session.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:session,require});
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/components/suivi/repcount-stepper.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:stepper,require});
const {renderToStaticMarkup} = require('react-dom/server');
const ui = {};
let stateIndex = 0;
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/components/suivi/repcount.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
  exports:ui, require: name => {
    if(name === 'react') return {...React,useState:initial=>React.useState((["Gainage planche",10,20,true,30,[],[
      log('2026-09-10',[{reps:0,charge:0,dureeSecondes:30}]),
      log('2026-09-03',[{reps:0,charge:0,dureeSecondes:20}])
    ]])[stateIndex++] ?? initial)};
    if(name === '@/lib/suivi/historique-exercice') return exportsModule;
    if(name === '@/lib/suivi/repcount-session') return session;
    if(name === '@/lib/suivi/repcount-draft') return {};
    if(name === '@/components/suivi/repcount-stepper') return stepper;
    if(name === '@/components/analytics/track-conversion') return {TrackConversion:()=>null};
    if(name === '@/lib/analytics/first-saved-conversion') return {firstSavedConversionId:async()=>null};
    if(name === '@/components/suivi/chandeliers-charges') return {ChandeliersCharges:()=>React.createElement('p',null,'CHARGE_CHART')};
    return require(name);
  }
});
const html = renderToStaticMarkup(React.createElement(ui.RepCount,{exercices:['Gainage planche'],exerciceInitial:'Gainage planche',hasAccess:true}));
for(const attendu of ['Secondes de maintien par séance','30 s de maintien','20 s de maintien','Augmenter Maintien','Maintien isométrique (secondes)']) assert.ok(html.includes(attendu),attendu);
assert.ok(!html.includes('Augmenter Charge'));
assert.ok(!html.includes('CHARGE_CHART'));
assert.ok(!html.includes('0 × 0 kg'));
console.log('PASS: historique et rendu RepCount (maintien conservé, unités séparées, comparaison, anciens logs, entrées invalides, champs et courbe en secondes)');
