// Local effect test: real component, simulated React lifecycle and HTTP/storage.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync('src/components/onboarding/activation-flow.tsx','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
// A connected welcome page must ask for its own intermediate draft, not
// the anonymous context. No profile or programme write is needed to resume.
for (const owner of ['fixture-a', 'fixture-b']) {
 const effects=[], states=[];
 const imports={
  react:{useEffect:fn=>effects.push(fn),useState:initial=>[initial,value=>states.push(value)]},
  'react/jsx-runtime':{jsx:()=>null,jsxs:()=>null},
  'next/link':{}, '@/components/ui/button':{}, '@/components/ui/section-label':{},
  '@/components/compte/profil-completion':{}, '@/components/programme/coach-review-link':{},
  '@/lib/diagnostic/storage':{readDiagnosticAnswers:email=>{assert.equal(email,owner+'@example.test');return null;}},
  '@/lib/diagnostic/progress-storage':{readDiagnosticProgress:requested=>{
   assert.equal(requested,owner,'Welcome must use the authenticated draft owner');
   return requested==='fixture-a'?{step:'niveau'}:null;
  }},
  '@/lib/analytics/funnel-events':{},
  '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:false,remplis:0})},
  '@/lib/checkout/intended-plan-cookie':{},
 };
 const box={exports:{},require:n=>{assert.ok(n in imports,n);return imports[n];},fetch:()=>assert.fail('Draft resumption must not submit answers')};
 vm.runInNewContext(compiled,box);
 box.exports.ActivationFlow({coachValidationRequise:false,profilInitial:null,declencherGenerationAuto:false,diagnosticOwnerId:owner,diagnosticEmail:owner+'@example.test'});
 effects[0](); await new Promise(resolve=>setImmediate(resolve));
 assert.equal(states.at(-1),owner==='fixture-a'?'reprise_possible':'sans_diagnostic');
}
console.log('PASS welcome requests only the authenticated owner draft, without automatic profile writes');
// Integrate the real transfer reader with the real welcome effect. A valid
// draft for A must cause no HTTP write when B opens the welcome page.
{
 const data=new Map(), storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const storeBox={exports:{},window:{localStorage:storage,sessionStorage:storage}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/diagnostic/storage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,storeBox);
 storeBox.exports.storeDiagnosticAnswers({age:42},'a@example.test');
 const effects=[],states=[]; let cursor=0;
 const element=(type,props)=>({type,props});
 const imports={
  react:{useEffect:fn=>effects.push(fn),useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>states[i]=value];}},
  'react/jsx-runtime':{jsx:element,jsxs:element},'next/link':{},
  '@/components/ui/button':{},'@/components/ui/section-label':{},
  '@/components/compte/profil-completion':{},'@/components/programme/coach-review-link':{},
  '@/lib/diagnostic/storage':storeBox.exports,
  '@/lib/diagnostic/progress-storage':{readDiagnosticProgress:()=>null},
  '@/lib/analytics/funnel-events':{},
  '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:false,remplis:0})},
  '@/lib/checkout/intended-plan-cookie':{},
 };
 const box={exports:{},require:n=>{assert.ok(n in imports,n);return imports[n];},fetch:()=>assert.fail('B must never submit A’s pre-signup answers')};
 vm.runInNewContext(compiled,box);
 const props={coachValidationRequise:false,profilInitial:null,declencherGenerationAuto:false,diagnosticOwnerId:'b',diagnosticEmail:'b@example.test'};
 box.exports.ActivationFlow(props);
 effects[0](); await new Promise(resolve=>setImmediate(resolve));
 assert.equal(states[0],'sans_diagnostic');
 cursor=0;
 const rendered=JSON.stringify(box.exports.ActivationFlow(props));
 assert.ok(rendered.includes('Un diagnostic a été préparé avec une autre adresse'));
 assert.ok(rendered.includes('Faire mon diagnostic'));
 assert.ok(!rendered.includes('a@example.test'),'Do not reveal another recipient’s address');
 assert.ok(!rendered.includes('42'),'Do not reveal another recipient’s answers');
 assert.equal(storeBox.exports.readDiagnosticAnswers('a@example.test').age,42);
 console.log('PASS real transfer reader + welcome: wrong account performs zero writes and preserves original draft');
}
for (const [programmes, expected, echecs = 0] of [
 [[{statut:'GENERE_IA'}],false], [[{statut:'VALIDE'}],false],
 [[{statut:'GENERE_IA'},{statut:'EN_ATTENTE'}],true],
 [[],null], [[{statut:'UNKNOWN'}],null], [null,null],
 [[{statut:'GENERE_IA'}],null,1],
]) {
 const values=[],effects=[]; let cursor=0;
 const element=(type,props)=>({type,props});
 const imports={
  '@/components/programme/coach-review-link':{},
  react:{useEffect:fn=>effects.push(fn),useState:initial=>{const i=cursor++;if(!(i in values))values[i]=initial;return [values[i],value=>values[i]=value];}},
  'react/jsx-runtime':{jsx:element,jsxs:element}, 'next/link':{},
  '@/components/ui/button':{}, '@/components/ui/section-label':{}, '@/components/compte/profil-completion':{},
  '@/lib/diagnostic/storage':{readDiagnosticAnswers:()=>null},
  '@/lib/diagnostic/progress-storage':{readDiagnosticProgress:()=>null},
  '@/lib/analytics/funnel-events':{trackFunnelEvent:()=>{}},
  '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:true})},
  '@/lib/checkout/intended-plan-cookie':{},
 };
 const box={exports:{},require:n=>{assert.ok(n in imports,n);return imports[n];},fetch:async url=>{
  assert.equal(url,'/api/programmes/generate?mode=onboarding');return {status:201,json:async()=>({programmes,echecs})};
 }};
 vm.runInNewContext(compiled,box);
 const props={coachValidationRequise:expected!==true,profilInitial:{},declencherGenerationAuto:true};
 box.exports.ActivationFlow(props); effects[0]();await new Promise(resolve=>setImmediate(resolve));
 cursor=0; const rendered=JSON.stringify(box.exports.ActivationFlow(props));
 assert.equal(values[0],expected===null?'erreur':'pret');
 if(expected===true){
  assert.ok(rendered.includes('Entraînement accessible · non relu'));
  assert.ok(rendered.includes('Accéder à mon entraînement'));
  assert.ok(!rendered.includes('avant d’être accessible'));
 }
 if(expected===false){assert.ok(rendered.includes('Commencer ma première séance'));assert.ok(!rendered.includes('À valider par ton coach'));}
 console.log(`PASS server programme status: ${JSON.stringify(programmes)}, review=${expected}`);
}
// Real cookie parsing + component rerender: retained choice must be a link,
// never a checkout request, and must not appear before profile persistence.
for (const [cookie, expected] of [
 ['coai_plan=PASS_IA; coai_billing=ANNUAL', '/pricing?selected=PASS_IA&billing=ANNUAL&vipSessions=1#pass-ia'],
 ['coai_plan=STANDARD; coai_billing=MONTHLY', '/pricing?selected=STANDARD&billing=MONTHLY&vipSessions=1#full-remote'],
 ['coai_plan=PREMIUM; coai_billing=QUARTERLY; coai_vip_sessions=4', '/pricing?selected=PREMIUM&billing=QUARTERLY&vipSessions=4#full-presentiel'],
 ['', null], ['coai_plan=INVALID; coai_billing=INVALID', null],
]) {
 const cookieBox={exports:{},document:{cookie}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/checkout/intended-plan-cookie.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,cookieBox);
 const values=[],effects=[],calls=[]; let cursor=0, saved=false;
 const element=(type,props)=>({type,props});
 const imports={
  '@/components/programme/coach-review-link':{},
  react:{useEffect:fn=>effects.push(fn),useState:initial=>{const i=cursor++;if(!(i in values))values[i]=initial;return [values[i],value=>values[i]=value];}},
  'react/jsx-runtime':{jsx:element,jsxs:element}, 'next/link':{default:'link'},
  '@/components/ui/button':{}, '@/components/ui/section-label':{}, '@/components/compte/profil-completion':{},
  '@/lib/diagnostic/storage':{readDiagnosticAnswers:()=>({age:42}),clearDiagnosticAnswers:()=>{assert.ok(saved);}},
  '@/lib/diagnostic/progress-storage':{readDiagnosticProgress:()=>null},
  '@/lib/analytics/funnel-events':{trackFunnelEvent:()=>{}},
  '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:true})},
  '@/lib/checkout/intended-plan-cookie':cookieBox.exports,
 };
 const box={exports:{},require:n=>{assert.ok(n in imports,n);return imports[n];},fetch:async url=>{calls.push(url);return {ok:true,json:async()=>{saved=true;return {age:42};}};}};
 vm.runInNewContext(compiled,box);
 const props={coachValidationRequise:false,profilInitial:null,declencherGenerationAuto:false};
 assert.equal(box.exports.ActivationFlow(props),null);
 effects[0](); await new Promise(resolve=>setImmediate(resolve));
 cursor=0;
 const tree=JSON.stringify(box.exports.ActivationFlow(props));
 assert.deepEqual(calls,['/api/profil']);
 if(expected){assert.ok(tree.includes(expected));assert.ok(tree.includes('Découvrir d’abord mon espace gratuit'));}
 else {assert.ok(!tree.includes('/pricing?'));assert.ok(tree.includes('Découvrir mon espace COAI'));}
 console.log(`PASS explicit offer resume: ${cookie || 'free signup'}`);
}
for(const scenario of ['http-error','network-error','invalid-json','null-json','success']) {
 let cleared=0, states=[], effects=[], calls=[];
 const imports={
  '@/components/programme/coach-review-link':{},
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
  '@/lib/checkout/intended-plan-cookie':{readIntendedPlanCookie:()=>null},
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

for (const statuses of [[409], [201], [403,201], [403,403,403,403,403,403], [429], [502], [401], [422]]) {
 const effects=[], states=[]; let calls=0;
 const imports={
  '@/components/programme/coach-review-link':{},
  react:{useEffect:fn=>effects.push(fn),useState:initial=>[initial,value=>states.push(value)]},
  'react/jsx-runtime':{jsx:()=>null,jsxs:()=>null},
  'next/link':{}, '@/components/ui/button':{}, '@/components/ui/section-label':{}, '@/components/compte/profil-completion':{},
  '@/lib/diagnostic/storage':{readDiagnosticAnswers:()=>null,clearDiagnosticAnswers:()=>assert.fail('No answers to clear')},
  '@/lib/diagnostic/progress-storage':{readDiagnosticProgress:()=>null},
  '@/lib/analytics/funnel-events':{trackFunnelEvent:()=>{}},
  '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:true})},
  '@/lib/checkout/intended-plan-cookie':{readIntendedPlanCookie:()=>null},
 };
 const box={exports:{},require:n=>{assert.ok(n in imports,n);return imports[n];},setTimeout:fn=>{fn();return 0;},
  fetch:async url=>{assert.equal(url,'/api/programmes/generate?mode=onboarding'); return {status:statuses[Math.min(calls++,statuses.length-1)],json:async()=>({programmes:[{statut:'GENERE_IA'}],requiresCoachReview:true})};}};
 vm.runInNewContext(compiled,box);
 box.exports.ActivationFlow({coachValidationRequise:false,profilInitial:{},declencherGenerationAuto:true});
 effects[0](); await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,statuses.length);
 const last=statuses.at(-1);
 assert.equal(states.at(-1),last===201?'pret':last===403?'debloquer':last===409?'relecture':'erreur');
 console.log(`PASS generation ${statuses.join('→')}: ${calls} request(s), no real API call`);
}
