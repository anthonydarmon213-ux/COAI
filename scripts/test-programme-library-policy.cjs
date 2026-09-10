// Actual route/filter/provider gate. In-memory data, no network or live account.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(file, imports, globals = {}) {
  const box = {exports:{}, URL, console, ...globals, require:name => {
    assert.ok(name in imports, name); return imports[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText, box);
  return box.exports;
}
const policy = load('src/lib/programmes/paid-policy.ts', {});
assert.equal(policy.PROGRAMME_AI_PAID_ENABLED, false);
const filter = load('src/lib/programmes-socles/index.ts', {
  'node:fs/promises':{}, 'node:path':require('node:path'),
  '@/lib/programmes-socles/cle':{}, '@/lib/programmes-socles/catalogue':{},
}, {process:{cwd:()=>'/fixture'}}).socleAcceptable;
const base = {contraintesSante:'Aucune',antecedentsMedicaux:'Néant'};
assert.equal(filter(base),true);
for (const profile of [
  {...base,contraintesSante:'douleur genou'}, {...base,antecedentsMedicaux:'opération du dos'},
  {...base,statutMaternite:'ENCEINTE'}, {...base,statutMaternite:'POST_PARTUM'},
  {...base,allergiesAlimentaires:'allergie arachide'},
]) assert.equal(filter(profile),false);

let user = {id:'fixture',profile:base,subscription:{plan:'PASS_IA'}};
let rows=[], access=true, authenticated=true, complete=true, missing=false, failed=false;
let creations=0, catalogueReads=0, providerCalls=0;
const catalogue=async()=>{catalogueReads++;if(failed)throw Error('fixture unavailable');return missing?null:{fixture:true};};
const route=load('src/app/api/programmes/generate/route.ts', {
  'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
  '@/lib/auth/server':{getCurrentUser:async()=>authenticated?{id:'auth'}:null},
  '@/lib/db/client':{prisma:{user:{findUnique:async()=>user},
    programmeGenerated:{findFirst:async({where})=>rows.filter(p=>p.pilier===where.pilier).at(-1)??null}}},
  '@/lib/subscription/plan':{hasProgrammeAccess:()=>access},
  '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:complete})},
  '@/lib/programmes-socles':{socleAcceptable:filter,socleEntrainement:catalogue,socleNutrition:catalogue,socleRecuperation:catalogue},
  '@/lib/programmes/save-generated':{saveGeneratedProgramme:async({contenu,onboarding,...input})=>{
    creations++;const programme={...input,id:'p'+creations};rows.push(programme);return {programme,created:true};
  }},
});
const req=(query='')=>new Request('http://localhost/api/programmes/generate'+query,{method:'POST'});
const providerImports={
  '@/lib/ai/client':{generateWithAI:()=>{providerCalls++;assert.fail('Paid provider must not be called');}},
  '@/lib/programmes/paid-policy':policy,
  '@/lib/programmes/qualite-seance':{},
};
for(const name of ['programme-entrainement-structure','programme-entrainement-session','programme-nutrition-structure',
 'programme-nutrition-jour','programme-recuperation-structure','programme-recuperation-jour'])
 providerImports['@/lib/ai/prompts/'+name]={};
const provider=load('src/lib/programmes/generer.ts',providerImports);
const engine=load('src/lib/adaptation/engine.ts',{
 '@/lib/db/client':{prisma:{
   programmeGenerated:{findFirst:async()=>({id:'old',contenu:{}})},
   programmeAdaptation:{findUnique:async()=>({id:'a',userId:'fixture',statut:'PROPOSEE',changements:[],pilier:'ENTRAINEMENT'})},
   user:{findUnique:async()=>user},
   $transaction:()=>assert.fail('No writes after paid gate'),
 }},
 '@/lib/ai/client':providerImports['@/lib/ai/client'],
 '@/lib/programmes/generer':provider,
 '@/lib/programmes/paid-policy':policy,
 '@/lib/email/client':{},'@/lib/subscription/plan':{},
 '@/lib/ai/prompts/programme-adaptation-decision':{},
 '@/lib/adaptation/signals':{collecterSignaux:async()=>({}),donneesSuffisantes:()=>true},
 '@/lib/analytics/product-events':{},'@/lib/cycle/phase':{buildContexteFeminin:()=>''},
});
(async()=>{
 for(const plan of ['PASS_IA','STANDARD','PREMIUM']){
   rows=[];user={...user,profile:base,subscription:{plan}};
   const response=await route.POST(req('?mode=onboarding'));
   assert.equal(response.status,201,plan);
   assert.equal(response.body.programmes.length,3);
   assert.ok(response.body.programmes.every(p=>p.statut==='GENERE_IA'&&!('contenu' in p)));
   const before=creations;
   const reused=await route.POST(req('?mode=onboarding'));
   assert.equal(reused.body.reused,true);assert.equal(creations,before);
 }
 rows=[{id:'pending',pilier:'ENTRAINEMENT',statut:'EN_ATTENTE'}];
 let before=creations;
 for(const query of ['', '?mode=onboarding']){
   assert.equal((await route.POST(req(query))).status,409);
   assert.equal(creations,before);assert.equal(rows[0].statut,'EN_ATTENTE');
 }
 rows=[];
 for(const profile of [{...base,antecedentsMedicaux:'chirurgie'},{...base,statutMaternite:'ENCEINTE'},
  {...base,contraintesSante:'douleur'}, {...base,allergiesAlimentaires:'allergie'}]){
   user.profile=profile;const reads=catalogueReads;
   const result=await route.POST(req('?paid=true&review=false'));
   assert.equal(result.status,409);assert.equal(result.body.requiresCoachReview,true);
   assert.equal(catalogueReads,reads);assert.equal(creations,before);
 }
 user.profile=base;missing=true;
 assert.equal((await route.POST(req())).status,409);assert.equal(creations,before);
 missing=false;failed=true;
 assert.equal((await route.POST(req())).status,503);assert.equal(creations,before);
 failed=false;complete=false;assert.equal((await route.POST(req())).status,422);
 complete=true;access=false;assert.equal((await route.POST(req())).status,403);
 access=true;authenticated=false;assert.equal((await route.POST(req())).status,401);
 for(const pilier of ['ENTRAINEMENT','NUTRITION','RECUPERATION'])
   await assert.rejects(provider.genererPilier(pilier,{},'fixture'),/payante automatique/);
 const proposal=await engine.proposerAdaptation(user,'ENTRAINEMENT');
 assert.equal(proposal.adaptationId,null);assert.equal(proposal.enAttenteConfirmation,false);
 assert.match(proposal.resume,/Aucune analyse IA payante/);
 const confirmed=await engine.confirmerAdaptation('fixture','a');
 assert.match(confirmed.error,/payante automatique/);
 assert.equal(providerCalls,0);
 console.log('PASS: all plans use library; health/history guard; pending preserved; missing/error has no paid fallback; auth/access; provider and adaptation paid gates.');
 console.log('LIMIT: in-memory persistence and mocked catalogue. No medical suitability or production end-to-end proof.');
})().catch(error=>{console.error(error);process.exitCode=1;});
