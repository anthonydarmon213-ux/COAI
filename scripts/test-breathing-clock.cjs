const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/components/dashboard/reperes-du-jour.tsx','utf8');
const ast=ts.createSourceFile('card.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let update,start,phase,effect;
function visit(node){
  if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='actualiserRespiration')update=node.initializer.arguments[0];
  if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='phaseRespiration')phase=node.initializer;
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='lancerRespiration')start=node;
  if(ts.isCallExpression(node)&&node.expression.getText(ast)==='useEffect'&&node.arguments[0].getText(ast).includes('visibilitychange'))effect=node.arguments[0];
  ts.forEachChild(node,visit);
}
visit(ast);assert.ok(update&&start&&phase&&effect);
const compile=text=>ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let now=100000,seconds=60,active=false,created=0,cleared=0;
const box={Date:{now:()=>now},Math,finRespiration:{current:null},intervalle:{current:null},
 setSecondes:v=>seconds=v,setRespirationActive:v=>active=v,
 setInterval:()=>++created,clearInterval:()=>cleared++,window:new EventTarget(),document:new EventTarget()};
box.document.visibilityState='visible';
box.actualiserRespiration=vm.runInNewContext(compile(`(${update.getText(ast)})`),box);
vm.runInNewContext(compile(start.getText(ast)),box);
const cleanup=vm.runInNewContext(compile(`(${effect.getText(ast)})`),box)();
box.lancerRespiration();box.lancerRespiration();assert.equal(created,1);assert.equal(active,true);
for(const [elapsed,remaining,inspiration] of [[0,60,true],[1000,59,true],[3999,57,true],[4000,56,false],[9999,51,false],[10000,50,true],[55000,5,false]]){
 now=100000+elapsed;box.actualiserRespiration();assert.equal(seconds,remaining);
 box.secondes=seconds;const text=vm.runInNewContext(compile(`(${phase.getText(ast)})`),box);
 assert.equal(text,inspiration?'Inspire doucement':'Expire doucement');
}
now=170000;box.window.dispatchEvent(new Event('pageshow'));
assert.equal(seconds,0);assert.equal(active,false);assert.equal(cleared,1);assert.equal(box.finRespiration.current,null);
box.lancerRespiration();assert.equal(created,2);assert.equal(seconds,60);
now+=15000;box.document.dispatchEvent(new Event('visibilitychange'));assert.equal(seconds,45);
cleanup();assert.equal(cleared,2);assert.equal(box.finRespiration.current,null);
box.window.dispatchEvent(new Event('pageshow'));assert.equal(seconds,45);
console.log('PASS breathing: 4s inhale/6s exhale, real elapsed deadline, delayed ticks, foreground return, restart, duplicate guard and cleanup. Clock/events simulated.');
