const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/components/dashboard/adaptation-notification-card.tsx','utf8');
const ast=ts.createSourceFile('card.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const handlers=[];
function visit(node){if(ts.isFunctionDeclaration(node)&&['handleConfirmer','handleRejeter'].includes(node.name?.text))handlers.push(node.getText(ast));ts.forEachChild(node,visit);}
visit(ast);assert.equal(handlers.length,2);
const code=ts.transpileModule(handlers.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
(async()=>{
  for(const name of ['handleConfirmer','handleRejeter'])for(const mode of ['success','http','malformed','network']){
    let calls=0,release,refresh=0,state='attente',error=null;
    const box={Error,Number,notification:{id:'test'},pending:{current:false},
      setLoading:()=>{},setError:v=>error=v,setEtat:v=>state=v,router:{refresh:()=>refresh++},
      fetch:async()=>{calls++;await new Promise(r=>release=r);if(mode==='network')throw new Error('network');return {ok:mode!=='http',json:async()=>mode==='malformed'?{}:{nouvelleVersion:2,ok:true,error:'failed'}};}};
    vm.runInNewContext(code,box);
    const request=box[name]();
    await box.handleConfirmer();await box.handleRejeter();assert.equal(calls,1,'Competing decisions blocked');
    release();await request;
    if(mode==='success'){
      assert.equal(state,name==='handleConfirmer'?'accepte':'rejete');assert.equal(error,null);
      assert.equal(refresh,name==='handleConfirmer'?1:0);assert.equal(box.pending.current,true);
    }else{assert.equal(state,'attente');assert.ok(error);assert.equal(refresh,0);assert.equal(box.pending.current,false);}
  }
  assert.ok(!source.includes('? "Adaptation appliquée"'));
  console.log('PASS adaptation actions: exclusive decisions, confirmed payload only, recoverable failures, truthful confirmation. Mock API; no paid generation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
