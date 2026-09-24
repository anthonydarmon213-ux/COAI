// Executes the real route with isolated in-memory persistence. No network.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
assert.ok(fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx','utf8')
 .includes('fetch("/api/programmes/generate?mode=onboarding"'),
 'First generation after applying a diagnostic must use the resumable activation mode');
const compiled = ts.transpileModule(fs.readFileSync('src/app/api/programmes/generate/route.ts','utf8'), {
  compilerOptions: {module:ts.ModuleKind.CommonJS},
}).outputText;
const records=[]; let authorized=true, access=true, appleUnavailable=false;
const prisma={
 user:{findUnique:async()=>({id:'fixture-user',profile:{},subscription:{plan:'PASS_IA'}})},
 programmeGenerated:{
  findFirst:async({where,select})=>{
   assert.equal(where.userId,'fixture-user');
   const found=records.filter(p=>!where.pilier||p.pilier===where.pilier).at(-1);
   if(!found)return null;
   return select?Object.fromEntries(Object.keys(select).map(key=>[key,found[key]])):found;
  },
  create:async({data})=>{const record={id:`p-${records.length}`, ...data};records.push(record);return record;},
 },
};
const socle=async()=>({fixture:true});
const imports={
 'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
 '@/lib/auth/server':{getCurrentUser:async()=>authorized?{id:'auth-fixture'}:null},
 '@/lib/programmes/save-generated':{saveGeneratedProgramme:async({onboarding,...data})=>{
   const record=await prisma.programmeGenerated.create({data:{...data,version:records.length+1}});
   const {contenu,...programme}=record;
   return {programme,created:true};
 }},
 '@/lib/db/client':{prisma},
 '@/lib/subscription/content-access':{contentAccessFor:async()=>({programme:access,appleUnavailable})},
 '@/lib/programmes-socles':{socleAcceptable:()=>true,socleEntrainement:socle,socleNutrition:socle,socleRecuperation:socle},
 '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:true})},
};
const box={exports:{},URL,console,require:name=>{assert.ok(name in imports,name);return imports[name];}};
vm.runInNewContext(compiled,box);
const request=()=>new Request('http://localhost/api/programmes/generate?mode=onboarding',{method:'POST'});
(async()=>{
 const first=await box.exports.POST(request());
 assert.equal(first.status,201);assert.equal(records.length,3);
 const initial=records.map(p=>p.id);
 for(let i=0;i<3;i++){
  const resumed=await box.exports.POST(request());
  assert.equal(resumed.body.reused,true);assert.equal(records.length,3);
  assert.deepEqual(Array.from(resumed.body.programmes,p=>p.id),initial);
  assert.ok(resumed.body.programmes.every(p=>!('contenu' in p)));
 }
 records[0].statut='EN_ATTENTE';
 assert.equal((await box.exports.POST(request())).body.programmes[0].statut,'EN_ATTENTE');
 assert.equal((await box.exports.POST(new Request('http://localhost/api/programmes/generate',{method:'POST'}))).status,409);
 assert.equal(records.length,3);
 records[0].statut='VALIDE'; // Coach validation simulated only in this fixture.
 // A failed partial first generation resumes only the missing pillar.
 records.pop();const preserved=records.map(p=>p.id);
 const partial=await box.exports.POST(request());
 assert.equal(records.length,3);assert.equal(partial.body.programmes.length,3);
 assert.deepEqual(records.slice(0,2).map(p=>p.id),preserved);
 // Explicit regeneration still creates new versions.
 await box.exports.POST(new Request('http://localhost/api/programmes/generate',{method:'POST'}));
 assert.equal(records.length,6);
 access=false;assert.equal((await box.exports.POST(request())).status,403);
 appleUnavailable=true;
 const unavailable=await box.exports.POST(request());
 assert.equal(unavailable.status,503);
 assert.match(unavailable.body.error,/sans effectuer de nouvel achat/);
 assert.equal(records.length,6);
 // Existing access survives an unavailable Apple verification service.
 access=true;
 assert.equal((await box.exports.POST(request())).status,201);
 assert.equal(records.length,6);
 authorized=false;assert.equal((await box.exports.POST(request())).status,401);
 assert.equal(records.length,6);
 console.log('PASS: repeated onboarding reuses IDs, metadata only, pending preserved, partial completion, explicit regeneration, auth/access gates, Apple unavailable with/without existing access');
 console.log('LIMIT: sequential requests; distributed concurrent generation is not covered');
})().catch(error=>{console.error(error);process.exitCode=1;});
