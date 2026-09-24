const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const queries = [];
const day = new Date('2026-09-24T00:00:00Z');
const daily = {id:'same-id', userId:'member', date:day, completedAt:new Date('2026-09-24T10:00:00Z'),
  adaptedSession:{nom:'Plan quotidien',exercices:[{nom:'Test',series:9,chargeKg:100}],duree:60},
  availableMinutes:60, feedbackComment:'Mon retour',workoutRating:'BIEN_DOSEE',feedbackPain:false};
const log = {id:'same-id',userId:'member',date:day,createdAt:new Date('2026-09-24T09:00:00Z'),exercices:[],source:'LIBRE'};
const db = {};
for(const [name,rows] of [['seanceLog',[log]],['dailySession',[daily]]]) {
  db[name] = {findMany:async args=>{queries.push(args);return rows;}, count:async args=>{queries.push(args);return rows.length;}};
}
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/suivi/workout-history.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,{exports:exportsObject,require(name){if(name==='server-only')return {};if(name==='@/lib/db/client')return {prisma:db};throw Error(name);}});
(async()=>{
  const {dailyHistoryEntry,workoutHistory,workoutHistoryCount}=exportsObject;
  assert.equal(dailyHistoryEntry({...daily,completedAt:null}),null);
  const entry=dailyHistoryEntry(daily);
  assert.equal(entry.dailyTitle,'Plan quotidien');
  assert.equal(entry.id,'daily:same-id');
  assert.equal(entry.exercices.length,0);
  for(const key of ['dureeMinutes','energie','difficulte','douleur','ressenti']) assert.equal(entry[key],null);
  assert.equal(entry.dailyPain,false);
  assert.equal(entry.dailyRating,'BIEN_DOSEE');
  assert.equal(entry.notes,'Mon retour');
  assert.equal(dailyHistoryEntry({...daily,adaptedSession:null}).dailyTitle,'Séance quotidienne');
  const before=JSON.stringify({daily,log});
  const result=await workoutHistory('member',{from:day,take:1});
  assert.equal(result.length,1);assert.equal(result[0].id,'daily:same-id');
  assert.equal((await workoutHistory('member',{order:'asc'}))[0].id,'same-id');
  assert.equal(await workoutHistoryCount('member',{from:day}),2);
  assert(queries.every(q=>q.where.userId==='member'));
  assert.equal(queries[1].where.completedAt.not,null);
  assert.equal(queries[0].where.date.gte,day);
  assert.equal(JSON.stringify({daily,log}),before);
  console.log('PASS history: completed only, no prescribed metrics invented, distinct identities, ordering/limit, scoped query contracts. Database mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
