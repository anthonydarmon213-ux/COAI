// Actual completion handler, isolated network; no real account is written.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const ast = ts.createSourceFile('runner.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function walk(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'terminerSeance') handler = node.getText(ast);
  ts.forEachChild(node, walk);
}
walk(ast);
assert.ok(handler);
const deadline = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/suivi/request-deadline.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
  {exports:deadline.exports, AbortController, setTimeout, clearTimeout});
async function scenario(mode, historyHangs = false) {
  const state = {}, posts = [], limits = [];
  let cleared = 0;
  const box = {
    Date, Map, Number, JSON, Error,
    envoiRef:{current:false}, debut:Date.now()-60000, index:0,
    steps:[{type:'set',exerciceIndex:0,setIndex:0,nom:'Squat'}],
    realise:{'0-0':{reps:10,charge:20}}, nomsRealises:{}, substitutions:{},
    dateSauvegarde:'2026-09-23T12:00:00.000Z', checkin:{energie:3}, nomSeance:'Test', cleBrouillon:'test',
    effacerSauvegarde:()=>cleared++, firstSavedConversionId:async()=>null,
    withRequestDeadline:(operation, milliseconds=20000)=>{
      limits.push(milliseconds);
      return deadline.exports.withRequestDeadline(operation, 10);
    },
    fetch:async(_url, options)=>{
      if (!options.method) {
        if(historyHangs) return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))));
        return Response.json([]);
      }
      posts.push(JSON.parse(options.body));
      if(mode==='timeout') return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))));
      if(mode==='html') return new Response('<html>Connexion</html>');
      if(mode==='empty') return Response.json({});
      if(mode==='refused') return new Response('',{status:401});
      return Response.json({id:'saved',source:mode==='source'?'REPCOUNT':'PROGRAMME',date:mode==='date'?'2000-01-01':box.dateSauvegarde});
    },
  };
  for(const name of ['EnvoiEnCours','ErreurSauvegarde','Bilan','TonnagePrecedent','PremiereSeanceId','Termine']) {
    box['set'+name]=value=>state[name]=value;
  }
  vm.runInNewContext(ts.transpileModule(handler+'\nglobalThis.run=terminerSeance;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,box);
  const first = box.run();
  await box.run(); // immediate duplicate tap is ignored
  await first;
  assert.equal(posts.length,1);
  assert.equal(state.Termine,true);
  assert.equal(state.EnvoiEnCours,false);
  assert.equal(box.envoiRef.current,false);
  assert.deepEqual(limits,[2000,20000]);
  assert.equal(state.ErreurSauvegarde,mode!=='ok');
  assert.equal(cleared,mode==='ok'?1:0);
  assert.equal(state.Bilan[0].sets[0].reps,10);
  if(mode!=='ok') {
    await box.run();
    assert.equal(posts[1].date,posts[0].date,'Retry must preserve transaction identity');
  }
}
(async()=>{
  for(const mode of ['ok','html','empty','source','date','refused','timeout']) await scenario(mode);
  await scenario('ok',true);
  console.log('PASS guided save: valid ack, malformed/mismatched/error/timeout retains draft, duplicate tap blocked, retry identity stable, optional history timeout permits save. Network simulated.');
})().catch(error=>{console.error(error);process.exitCode=1;});
