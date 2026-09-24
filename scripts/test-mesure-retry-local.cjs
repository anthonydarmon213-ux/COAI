// Actual PostgreSQL and route. Authentication is deliberately simulated.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {randomUUID}=require('node:crypto');
const url=new URL(process.env.DATABASE_URL);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'54322');
const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();const users=[];
function load(file,modules){const api={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:api,require:n=>modules[n]||require(n)});return api;}
const validation=load('src/lib/suivi/mesure-validation.ts',{});
function route(owner){return load('src/app/api/mesures/route.ts',{
 '@/lib/suivi/mesure-validation':validation,
 '@/lib/auth/server':{getCurrentUser:async()=>({id:owner})},
 '@/lib/storage/progress-photos':{isOwnedProgressPhotoPath:(id,p)=>p.startsWith(id+'/')},
 '@/lib/db/client':{prisma:db},
});}
(async()=>{
 for(let i=0;i<2;i++){const id=randomUUID();users.push(await db.user.create({data:{email:`measure-${id}@example.test`,supabaseAuthId:id}}));}
 const [a,b]=users, key=randomUUID(),body={date:'2026-09-24',poidsKg:80};
 const send=(user,data=body,k=key)=>route(user.supabaseAuthId).POST(new Request('http://localhost/api/mesures',{method:'POST',headers:{'content-type':'application/json','x-coai-request-id':k},body:JSON.stringify(data)}));
 const rs=await Promise.all([send(a),send(a),send(a)]);
 assert.deepEqual(rs.map(r=>r.status).sort(),[200,200,201]);
 const results=await Promise.all(rs.map(r=>r.json()));assert.equal(new Set(results.map(r=>r.id)).size,1);
 assert.equal(await db.mesure.count({where:{userId:a.id}}),1);
 assert.equal((await send(a,{...body,poidsKg:81})).status,409);
 assert.equal((await send(b)).status,201);
 assert.equal(await db.mesure.count({where:{userId:b.id}}),1);
 assert.equal((await send(a,body,randomUUID())).status,201);
 assert.equal(await db.mesure.count({where:{userId:a.id}}),2);
 console.log('PASS real local PostgreSQL: concurrent retries create one row, distinct key creates another, changed payload rejected, accounts isolated. Auth mocked; no HTTP/UI/production proof.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{for(const u of users)await db.user.delete({where:{id:u.id}});await db.$disconnect();console.log('Disposable local users and measurements removed');});
