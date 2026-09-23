const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/components/dashboard/reperes-du-jour.tsx','utf8');
const ast=ts.createSourceFile('card.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let handler;
function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='enregistrerPas')handler=node;ts.forEachChild(node,visit);}
visit(ast);assert.ok(handler);
const code=ts.transpileModule(handler.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
(async()=>{
 for(const mode of ['ok','edited','http','session','network','wrong']){
  let error=null,saved=null,input='6500',calls=0,release,loading=false;
  const box={Error,Number,JSON,saisiePas:'6500',sauvegardePas:{current:false},revisionPas:{current:0},
   setErreurPas:v=>error=v,setEnregistrement:v=>loading=v,setPas:v=>saved=v,setMoyennePas:()=>{},
   setSaisiePas:fn=>input=fn(input),fetch:async()=>{calls++;await new Promise(r=>release=r);if(mode==='network')throw Error('offline');return {ok:!['http','session'].includes(mode),status:mode==='session'?401:500,json:async()=>({entreeAujourdhui:{pas:mode==='wrong'?12:6500},signaux:{moyenne7j:6000}})};}};
  vm.runInNewContext(code,box);
  const first=box.enregistrerPas();await box.enregistrerPas();assert.equal(calls,1);assert.equal(loading,true);
  if(mode==='edited')input='7000';release();await first;
  if(['ok','edited'].includes(mode)){assert.equal(saved,6500);assert.equal(input,mode==='edited'?'7000':'');assert.equal(error,null);}
  else{assert.equal(saved,null);assert.equal(input,'6500');assert.ok(error);if(mode==='session')assert.match(error,/expiré/);}
  assert.equal(loading,false);assert.equal(box.sauvegardePas.current,false);assert.equal(box.revisionPas.current,1);
  for(const invalid of ['', ' ', '-1','1.5','100001','Infinity','no']){
   box.saisiePas=invalid;await box.enregistrerPas();assert.equal(calls,1);assert.match(error,/nombre entier/);
  }
 }
 assert.match(source,/if \(!active \|\| revisionPas.current !== revision\) return/);
 console.log('PASS daily steps: confirmed value only, visible failures, session expiry, preserved newer input, duplicate guard, bounds; mocked API, stale-load guard inspected.');
})().catch(error=>{console.error(error);process.exitCode=1;});
