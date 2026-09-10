// Actual POST route + two local PostgreSQL clients. Auth/events simulated.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const ts = require('typescript');
const {PrismaClient} = require('@prisma/client');
const clients = [0,1].map(() => new PrismaClient({datasources:{db:{
  url:'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
}}}));
const owned = [];
const compiled = ts.transpileModule(fs.readFileSync('src/app/api/seances/route.ts','utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS},
}).outputText;
function route(prisma, authId, events) {
  const imports = {
    'next/server': require('next/server'), zod:require('zod'),
    '@/lib/auth/server':{getCurrentUser:async()=>authId ? {id:authId} : null},
    '@/lib/db/client':{prisma},
    '@/lib/analytics/product-events':{trackServerEvent:(...args)=>events.push(args)},
  };
  const box = {exports:{},require:name=>{assert.ok(name in imports,name);return imports[name];}};
  vm.runInNewContext(compiled,box);
  return box.exports.POST;
}
function request(source,date,extra={}) {
  return new Request('http://localhost:3050/api/seances',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({source,date,exercices:[{nom:'Planche test',sets:[{set:1,reps:0,charge:0,dureeSecondes:30}]}],...extra})});
}
async function fixture() {
  const id=randomUUID();
  const user=await clients[0].user.create({data:{id,supabaseAuthId:randomUUID(),email:`seance-concurrency-${id}@example.test`}});
  owned.push(user.id);return user;
}
(async()=>{
  try {
    for(const source of ['PROGRAMME','REPCOUNT']) {
      const user=await fixture();const events=[];
      const handlers=clients.map(db=>route(db,user.supabaseAuthId,events));
      const date=new Date().toISOString();
      const responses=await Promise.all([0,1,0,1].map(i=>handlers[i](request(source,date))));
      assert.equal(responses.filter(r=>r.status===201).length,1);
      assert.equal(responses.filter(r=>r.status===200).length,3);
      const bodies=await Promise.all(responses.map(r=>r.json()));
      assert.equal(new Set(bodies.map(b=>b.id)).size,1);
      assert.equal(await clients[0].seanceLog.count({where:{userId:user.id}}),1);
      assert.equal(events.filter(e=>e[0]===(source==='PROGRAMME'?'first_workout_completed':'repcount_saved')).length,1);
      assert.equal(bodies[0].exercices[0].sets[0].dureeSecondes,30);
      const retry=await handlers[1](request(source,date,{notes:'Do not overwrite the saved session'}));
      assert.equal(retry.status,200);assert.equal((await retry.json()).notes,null);
      console.log(`PASS ${source}: four concurrent posts, one row/first event; lost-response retry reuses ID without overwrite`);
    }
    // Distinct simultaneous workouts: both saved, only one is first.
    const user=await fixture();const events=[];
    const results=await Promise.all(clients.map((db,i)=>route(db,user.supabaseAuthId,events)(
      request('PROGRAMME',new Date(Date.now()+i*1000).toISOString()))));
    assert.ok(results.every(r=>r.status===201));
    assert.equal(results.filter(r=>r.headers.get('X-COAI-First-Source')==='1').length,1);
    assert.equal(events.filter(e=>e[0]==='first_workout_completed').length,1);
    assert.equal(events.filter(e=>e[0]==='workout_completed').length,2);
    assert.equal(await clients[0].seanceLog.count({where:{userId:user.id}}),2);
    // Failure after INSERT must roll back; retry from the other connection works.
    const failed=await fixture();const failureEvents=[];const date=new Date().toISOString();
    const faultDb={user:clients[0].user,$transaction:work=>clients[0].$transaction(async tx=>{
      await work(tx);throw Error('injected failure before commit');
    })};
    await assert.rejects(route(faultDb,failed.supabaseAuthId,failureEvents)(request('PROGRAMME',date)),/injected/);
    assert.equal(await clients[1].seanceLog.count({where:{userId:failed.id}}),0);
    assert.equal(failureEvents.length,0);
    assert.equal((await route(clients[1],failed.supabaseAuthId,failureEvents)(request('PROGRAMME',date))).status,201);
    assert.equal(failureEvents.filter(e=>e[0]==='first_workout_completed').length,1);
    assert.equal((await route(clients[0],null,[])(request('PROGRAMME',date))).status,401);
    console.log('PASS distinct dates, first event uniqueness, rollback/retry, anonymous rejection');
    console.log('LIMIT: direct route invocation, not HTTP; no GA4/Meta delivery or WhatsApp webhook verified');
  } finally {
    // Delete only exact random fixture users and their test sessions.
    for(const id of owned) {
      await clients[0].seanceLog.deleteMany({where:{userId:id}});
      await clients[0].user.delete({where:{id}});
    }
    await Promise.all(clients.map(db=>db.$disconnect()));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
