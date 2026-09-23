const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/components/suivi/repcount.tsx','utf8');
const ast=ts.createSourceFile('rep.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let charger;
function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='charger')charger=node.initializer.arguments[0];ts.forEachChild(node,visit);}
visit(ast);assert.ok(charger);
const code=ts.transpileModule(`(${charger.getText(ast)})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
(async()=>{
 for(const oldFails of [false,true]){
  const pending=[],results=[],errors=[];
  const box={Error,Array,historiqueRequest:{current:0},setSeances:v=>results.push(v),setHistoriqueErreur:v=>errors.push(v),
   withRequestDeadline:fn=>fn(undefined),fetch:()=>new Promise(resolve=>pending.push(resolve))};
  const load=vm.runInNewContext(code,box);
  const old=load(),fresh=load();
  pending[1]({ok:true,json:async()=>['latest']});await fresh;
  pending[0]({ok:!oldFails,json:async()=>['stale']});await old;
  assert.deepEqual(results,[['latest']]);assert.deepEqual(errors,[false]);
  const unmounted=load();box.historiqueRequest.current++;
  pending[2]({ok:true,json:async()=>['after-unmount']});await unmounted;
  assert.equal(results.length,1);
  const failure=load();pending[3]({ok:false});await failure;
  assert.deepEqual(errors,[false,true],'Current failure stays visible');
 }
 console.log('PASS RepCount history: newest response wins, stale failure ignored, unmounted response ignored, current failure reported. Mock network only.');
})().catch(error=>{console.error(error);process.exitCode=1;});
