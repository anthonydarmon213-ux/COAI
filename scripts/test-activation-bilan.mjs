// Local effect test: real component, simulated React lifecycle and HTTP/storage.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync('src/components/onboarding/activation-flow.tsx','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
for(const scenario of ['http-error','network-error','invalid-json','null-json','success']) {
 let cleared=0, states=[], effects=[], calls=[];
 const imports={
  react:{useEffect:fn=>effects.push(fn),useState:initial=>[initial,value=>states.push(value)]},
  'react/jsx-runtime':{jsx:()=>null,jsxs:()=>null},
  'next/link':{},
  '@/components/ui/button':{},
  '@/components/ui/section-label':{},
  '@/components/compte/profil-completion':{},
  '@/lib/diagnostic/storage':{readDiagnosticAnswers:()=>({age:40}),clearDiagnosticAnswers:()=>cleared++},
  '@/lib/diagnostic/progress-storage':{readDiagnosticProgress:()=>null},
  '@/lib/analytics/funnel-events':{trackFunnelEvent:()=>{}},
  '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:true})},
 };
 const box={exports:{},require:n=>{assert.ok(n in imports,n);return imports[n];},fetch:async url=>{
  calls.push(url);
  if(scenario==='network-error')throw Error('offline');
  return {ok:scenario!=='http-error',json:async()=>{
   if(scenario==='invalid-json')throw Error('bad json');
   return scenario==='null-json'?null:{age:40};
  }};
 }};
 vm.runInNewContext(compiled,box);
 box.exports.ActivationFlow({coachValidationRequise:true,profilInitial:null,declencherGenerationAuto:false});
 effects[0]();
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(calls,['/api/profil']);
 assert.equal(cleared,scenario==='success'?1:0);
 assert.equal(states.at(-1),scenario==='success'?'exploration':'erreur_bilan');
 console.log(`PASS ${scenario}: clear=${cleared}, state=${states.at(-1)}`);
}
