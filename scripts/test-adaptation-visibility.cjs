const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/components/dashboard/adaptation-notification-card.tsx','utf8');
const ast=ts.createSourceFile('card.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let read,dismiss,subscribe;
function visit(node){
  if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='readSeen')read=node.initializer.arguments[0];
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='dismiss')dismiss=node;
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='subscribeSeenAdaptations')subscribe=node;
  ts.forEachChild(node,visit);
}
visit(ast);assert.ok(read&&dismiss&&subscribe);
const compile=text=>ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const saved=new Map();let closed=false,blocked=false;
const box={STORAGE_PREFIX:'coai_adaptation_vue_',notification:{id:'one'},window:new EventTarget(),
  sessionStorage:{getItem:key=>{if(blocked)throw Error('blocked');return saved.get(key)??null;},setItem:(key,value)=>{if(blocked)throw Error('blocked');saved.set(key,value);}},
  setDismissed:value=>closed=value};
const snapshot=vm.runInNewContext(compile(`(${read.getText(ast)})`),box);
vm.runInNewContext(compile(dismiss.getText(ast)+'\n'+subscribe.getText(ast)),box);
assert.equal(snapshot(),false);
saved.set('coai_adaptation_vue_one','unexpected');assert.equal(snapshot(),false);
box.dismiss();assert.equal(closed,true);assert.equal(snapshot(),true);
box.notification.id='two';assert.equal(snapshot(),false,'Other proposal remains visible');
blocked=true;closed=false;assert.equal(snapshot(),false);
assert.doesNotThrow(()=>box.dismiss());assert.equal(closed,true);
let calls=0;const cleanup=box.subscribeSeenAdaptations(()=>calls++);
for(const [key,expected] of [['unrelated',0],['coai_adaptation_vue_one',1],[null,2]]){
  const event=new Event('storage');Object.defineProperty(event,'key',{value:key});box.window.dispatchEvent(event);assert.equal(calls,expected);
}
box.window.dispatchEvent(new Event('pageshow'));assert.equal(calls,3);
cleanup();box.window.dispatchEvent(new Event('pageshow'));assert.equal(calls,3);
assert.match(source,/key=\{props.notification.id\}/);
assert.match(source,/const serverSeenSnapshot = \(\) => true/);
console.log('PASS adaptation visibility: valid dismissal, unknown marker, separate proposals, denied storage, page return, subscription cleanup. Isolated callbacks, not device E2E.');
