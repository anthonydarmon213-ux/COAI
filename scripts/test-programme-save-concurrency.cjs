// Actual generation route and persistence on two LOCAL PostgreSQL clients.
// Auth/profile/catalogue simulated, no paid provider, email or production writes.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const {PrismaClient} = require('@prisma/client');
const clients = [0,1].map(() => new PrismaClient({datasources:{db:{
  url:'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
}}}));
const id = crypto.randomUUID();
function load(file, imports) {
  const box = {exports:{}, URL, console, process:{env:{}}, require:name=>{
    assert.ok(name in imports,name); return imports[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText,box);
  return box.exports;
}
function helper(db) {
  return load('src/lib/programmes/save-generated.ts',{'@/lib/db/client':{prisma:db}});
}
let notifications=0;
function route(db) {
  const socle=async()=>({fixture:true,privateDetails:'must not appear in response'});
  return load('src/app/api/programmes/generate/route.ts',{
    'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
    '@/lib/auth/server':{getCurrentUser:async()=>({id})},
    '@/lib/db/client':{prisma:{programmeGenerated:db.programmeGenerated,
      user:{findUnique:async()=>({id,profile:{},subscription:{plan:'PASS_IA'}})}}},
    '@/lib/programmes/generer':{genererPilier:()=>assert.fail('No paid generation')},
    '@/lib/programmes/save-generated':helper(db),
    '@/lib/email/client':{sendAdminNotification:async()=>{notifications++;}},
    '@/lib/email/coach-notification':{},
    '@/lib/subscription/plan':{hasProgrammeAccess:()=>true,getEffectivePlan:()=>'PASS_IA'},
    '@/lib/subscription/generation-quota':{getGenerationQuotaState:()=>({epuise:false})},
    '@/lib/programmes-socles':{socleAcceptable:()=>true,socleEntrainement:socle,socleNutrition:socle,socleRecuperation:socle},
    '@/lib/profil/completion':{computeProfilCompletion:()=>({essentielComplet:true})},
    '@/lib/cycle/phase':{buildContexteFeminin:()=>''},
  });
}
(async()=>{
 try {
  await clients[0].user.create({data:{id,supabaseAuthId:id,email:`concurrency-${id}@example.test`}});
  const routes=clients.map(route);
  const request=onboarding=>new Request('http://localhost/api/programmes/generate'+(onboarding?'?mode=onboarding':''),{method:'POST'});
  const results=await Promise.all([0,1,0,1].map(i=>routes[i].POST(request(true))));
  assert.ok(results.every(r=>r.status===201));
  const initial=await clients[0].programmeGenerated.findMany({where:{userId:id}});
  assert.equal(initial.length,3);
  assert.ok(initial.every(p=>p.version===1));
  for(const r of results){
    assert.equal(r.body.programmes.length,3);
    assert.deepEqual(Array.from(r.body.programmes,p=>p.id).sort(),initial.map(p=>p.id).sort());
    assert.ok(r.body.programmes.every(p=>!('contenu' in p)));
  }
  await clients[0].programmeGenerated.update({where:{id:initial[0].id},data:{statut:'EN_ATTENTE'}});
  const resumed=await routes[0].POST(request(true));
  assert.equal(resumed.body.programmes.find(p=>p.id===initial[0].id).statut,'EN_ATTENTE');
  assert.equal((await routes[0].POST(request(false))).status,409);
  const protectedPending=await helper(clients[1]).saveGeneratedProgramme({
    userId:id,pilier:initial[0].pilier,statut:'GENERE_IA',contenu:{fixture:true},onboarding:false,
  });
  assert.equal(protectedPending.created,false);
  assert.equal(protectedPending.programme.id,initial[0].id);
  assert.equal(protectedPending.programme.statut,'EN_ATTENTE');
  await clients[0].programmeGenerated.update({where:{id:initial[0].id},data:{statut:'VALIDE'}});
  await Promise.all(routes.map(r=>r.POST(request(false))));
  const all=await clients[0].programmeGenerated.findMany({where:{userId:id},orderBy:{version:'asc'}});
  assert.equal(all.length,9);
  for(const pilier of ['ENTRAINEMENT','NUTRITION','RECUPERATION']) {
    assert.deepEqual(all.filter(p=>p.pilier===pilier).map(p=>p.version),[1,2,3]);
  }
  const payload={userId:id,pilier:'ENTRAINEMENT',statut:'GENERE_IA',contenu:{fixture:true},onboarding:false};
  const broken=helper({$transaction:work=>clients[0].$transaction(async tx=>{
    await work(tx); throw Error('fixture failure before commit');
  })});
  await assert.rejects(broken.saveGeneratedProgramme(payload),/fixture failure/);
  assert.equal(await clients[0].programmeGenerated.count({where:{userId:id}}),9);
  const retry=await helper(clients[1]).saveGeneratedProgramme(payload);
  const saved=await clients[0].programmeGenerated.findUnique({where:{id:retry.programme.id}});
  assert.equal(saved.version,4);
  assert.equal(notifications,0);
  console.log('PASS actual route: 4 concurrent activations → 3 identical IDs, metadata only, pending preserved');
  console.log('PASS concurrent explicit generations: versions 1/2/3; rollback leaves no row, retry creates version 4');
  console.log('PASS pending preserved by HTTP and under the save transaction, including explicit regeneration.');
  console.log('LIMIT: catalogue mocked; no production writes or paid calls.');
 } finally {
  await clients[0].user.deleteMany({where:{id,email:`concurrency-${id}@example.test`}});
  await Promise.all(clients.map(db=>db.$disconnect()));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
