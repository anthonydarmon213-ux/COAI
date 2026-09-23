const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/components/dashboard/reperes-du-jour.tsx','utf8');
const ast=ts.createSourceFile('card.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const functions=[];
function visit(node){if(ts.isFunctionDeclaration(node)&&['cleEau','ajouterUnVerre'].includes(node.name?.text))functions.push(node.getText(ast));ts.forEachChild(node,visit);}
visit(ast);assert.equal(functions.length,2);
const data=new Map();let count=0,error=false,blocked=false;
class Clock extends Date {constructor(){super('2026-09-23T12:00:00Z');}}
const box={Date:Clock,encodeURIComponent,CLE_EAU:'coai_eau_aujourdhui_',userId:'account-a',verres:0,
 setVerres:v=>count=v,setErreurEau:v=>error=v,
 localStorage:{setItem:(key,value)=>{if(blocked)throw Error('denied');data.set(key,value);}}};
vm.runInNewContext(ts.transpileModule(functions.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,box);
data.set('coai_eau_aujourdhui_2026-09-23','9');
assert.notEqual(box.cleEau('account-a'),box.cleEau('account-b'));
assert.notEqual(box.cleEau('account-a'), 'coai_eau_aujourdhui_2026-09-23');
box.ajouterUnVerre();assert.equal(count,1);assert.equal(error,false);
assert.equal(data.get(box.cleEau('account-a')),'1');
assert.equal(data.get(box.cleEau('account-b')),undefined);
box.userId='account-b';box.ajouterUnVerre();assert.equal(data.get(box.cleEau('account-b')),'1');
blocked=true;box.verres=1;assert.doesNotThrow(()=>box.ajouterUnVerre());
assert.equal(count,2);assert.equal(error,true);assert.equal(data.get(box.cleEau('account-b')),'1');
assert.match(source,/key=\{props.userId\}/);
assert.match(source,/localStorage.getItem\(cleEau\(userId\)\)/);
assert.match(fs.readFileSync('src/app/(app)/dashboard/page.tsx','utf8'),/ReperesDuJour userId=\{user.id\}/);
console.log('PASS hydration storage: distinct accounts, no legacy reassignment, blocked writes disclosed, account-keyed component wiring. Isolated callbacks; not live account switching.');
