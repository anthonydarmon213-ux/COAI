const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,modules){const api={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:api,require:n=>modules[n]||require(n)});return api;}
const validation=load('src/lib/suivi/mesure-validation.ts',{});
const rows=new Map();let owner='one';
const route=load('src/app/api/mesures/route.ts',{
 '@/lib/suivi/mesure-validation':validation,
 '@/lib/auth/server':{getCurrentUser:async()=>({id:owner})},
 '@/lib/storage/progress-photos':{isOwnedProgressPhotoPath:(id,path)=>path.startsWith(id+'/')},
 '@/lib/db/client':{prisma:{user:{findUnique:async()=>({id:owner})},mesure:{
  create:async({data})=>{if(rows.has(data.id))throw {code:'P2002'};const r={...data};rows.set(data.id,r);return r;},
  findUnique:async({where})=>rows.get(where.id),
 }}}
});
const key='12345678-1234-4123-8123-123456789abc';
const body={date:'2026-09-24',poidsKg:80};
const post=(data=body,k=key)=>route.POST(new Request('http://localhost/api/mesures',{method:'POST',headers:{'content-type':'application/json','x-coai-request-id':k},body:JSON.stringify(data)}));
(async()=>{
 const responses=await Promise.all([post(),post(),post()]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,200,201]);assert.equal(rows.size,1);
 assert.equal((await post({...body,poidsKg:81})).status,409);assert.equal(rows.size,1);
 owner='two';assert.equal((await post()).status,201);assert.equal(rows.size,2);
 assert.equal((await post(body,'invalid')).status,400);
 assert.equal((await post({...body,photoPath:'one/photo.jpg'})).status,400);
 console.log('PASS measure retry: repeated/concurrent requests, changed payload conflict, owner isolation, invalid key; DB/auth simulated');
})().catch(e=>{console.error(e);process.exitCode=1;});
