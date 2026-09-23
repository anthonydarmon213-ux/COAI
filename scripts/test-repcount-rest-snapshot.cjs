const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const ast=ts.createSourceFile('rep.tsx',fs.readFileSync('src/components/suivi/repcount.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const callbacks={};
function visit(node){if(ts.isVariableDeclaration(node)&&['readRest','subscribeRest'].includes(node.name.getText(ast)))callbacks[node.name.getText(ast)]=node.initializer.arguments[0];ts.forEachChild(node,visit);}
visit(ast);let now=100000,refreshes=0,cleared=false;
const window=new EventTarget(),document=new EventTarget();
window.setInterval=fn=>{window.tick=fn;return 1;};window.clearInterval=id=>{assert.equal(id,1);cleared=true;};
const box={window,document,Date:{now:()=>now},Math,finRepos:190000};
const load=name=>vm.runInNewContext(ts.transpileModule(`(${callbacks[name].getText(ast)})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,box);
const read=load('readRest'),subscribe=load('subscribeRest');
assert.equal(read(),90);assert.equal(read(),90);
const cleanup=subscribe(()=>refreshes++);
now+=15500;assert.equal(read(),75);window.tick();assert.equal(refreshes,1);
now+=100000;window.dispatchEvent(new Event('pageshow'));assert.equal(read(),0);assert.equal(refreshes,2);
document.dispatchEvent(new Event('visibilitychange'));assert.equal(refreshes,3);
cleanup();assert.equal(cleared,true);window.dispatchEvent(new Event('pageshow'));assert.equal(refreshes,3);
box.finRepos=null;assert.equal(read(),null);assert.equal(typeof subscribe(()=>{}),'function');
console.log('PASS RepCount rest: current deadline snapshot, suspended time, expiry, reset and listener cleanup. Simulated clock/events.');
