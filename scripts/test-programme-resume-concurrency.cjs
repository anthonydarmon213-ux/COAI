const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const ts=require('typescript');
const {PrismaClient}=require('@prisma/client');
const clients=[0,1].map(()=>new PrismaClient({datasources:{db:{url:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'}}}));
const ids=[crypto.randomUUID(),crypto.randomUUID()];
let events=0;
const source=fs.readFileSync('src/lib/adaptation/engine.ts','utf8');
const ast=ts.createSourceFile('engine.ts',source,ts.ScriptTarget.Latest,true);
const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='reprendreProgrammeHabituel');
assert.ok(fn);
function resume(db){
 const box={exports:{},prisma:db,trackServerEvent:()=>events++};
 vm.runInNewContext(ts.transpileModule(fn.getText(ast),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,box);
 return box.exports.reprendreProgrammeHabituel;
}
(async()=>{
 try{
  for(const id of ids)await clients[0].user.create({data:{id,supabaseAuthId:id,email:`resume-${id}@example.test`}});
  const db=clients[0],userId=ids[0],pilier='ENTRAINEMENT';
  const old=await db.programmeGenerated.create({data:{userId,pilier,contenu:{fixture:'original'},statut:'GENERE_IA',version:1}});
  const travel=await db.programmeGenerated.create({data:{userId,pilier,contenu:{fixture:'travel'},statut:'GENERE_IA',version:2,temporaire:true}});
  const link=await db.programmeAdaptation.create({data:{userId,pilier,decision:'GARDER',changements:[],resume:'fixture',programmePrecedentId:old.id,programmeSuivantId:travel.id}});
  // Failure after both writes: neither programme nor history may survive.
  const broken={$transaction:work=>db.$transaction(async tx=>{await work(tx);throw Error('fixture rollback');})};
  await assert.rejects(resume(broken)(userId,pilier),/fixture rollback/);
  assert.equal(await db.programmeGenerated.count({where:{userId}}),2);
  assert.equal(await db.programmeAdaptation.count({where:{userId}}),1);
  assert.equal(events,0);
  const results=await Promise.all([0,1,0,1].map(i=>resume(clients[i])(userId,pilier)));
  assert.equal(results.filter(Boolean).length,1);
  assert.equal(results.find(Boolean).nouvelleVersion,3);
  assert.equal(events,1);
  const all=await db.programmeGenerated.findMany({where:{userId},orderBy:{version:'asc'}});
  assert.deepEqual(all.map(p=>p.version),[1,2,3]);
  assert.deepEqual(all[2].contenu,old.contenu); assert.equal(all[2].temporaire,false);
  assert.equal(await db.programmeAdaptation.count({where:{userId}}),2);
  assert.equal(await resume(clients[1])(userId,pilier),null);
  // Unrelated user's content must never be copied via a corrupt history ID.
  await db.programmeGenerated.update({where:{id:all[2].id},data:{temporaire:true}});
  const other=await db.programmeGenerated.create({data:{userId:ids[1],pilier,contenu:{fixture:'private-other'},statut:'VALIDE'}});
  await db.programmeAdaptation.create({data:{userId,pilier,decision:'GARDER',changements:[],resume:'corrupt fixture',programmePrecedentId:other.id,programmeSuivantId:all[2].id}});
  assert.equal(await resume(clients[1])(userId,pilier),null);
  assert.equal(await db.programmeGenerated.count({where:{userId}}),3);
  assert.ok(link.id);
  console.log('PASS actual resume/local PostgreSQL: four callers → one version/history/event; rollback atomic; retry no-op; cross-user source rejected');
  console.log('LIMIT: this test covers resume only, not paid generation or provider concurrency; no production writes or emails');
 }finally{
  for(const id of ids)await clients[0].user.deleteMany({where:{id,email:`resume-${id}@example.test`}});
  await Promise.all(clients.map(db=>db.$disconnect()));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
