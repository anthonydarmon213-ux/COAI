// Run with node --conditions=react-server scripts/test-request-time.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react');
const {renderToReadableStream}=require('next/dist/compiled/react-server-dom-webpack/server.node');
let now=100000,reads=0;
const box={exports:{},Date:{now:()=>{reads++;return now;}},require:name=>{
 if(name==='react')return React;
 if(name==='server-only')return {}; // Next's build checks this import boundary.
 throw Error(name);
}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/server/request-time.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,box);
async function request(){
 const values=[];
 async function Probe(){
  values.push(box.exports.requestTime());now+=1000;
  values.push(box.exports.requestTime());await Promise.resolve();now+=1000;
  values.push(box.exports.requestTime());return React.createElement('span',null,values.join(','));
 }
 const errors=[];
 const stream=await renderToReadableStream(React.createElement(Probe),{}, {onError:e=>errors.push(e)});
 const reader=stream.getReader();while(!(await reader.read()).done){}
 assert.deepEqual(errors,[]);return values;
}
(async()=>{
 const first=await request();assert.deepEqual(first,[100000,100000,100000]);assert.equal(reads,1);
 const second=await request();assert.deepEqual(second,[102000,102000,102000]);assert.equal(reads,2);
 console.log('PASS actual React Server Component renderer: stable timestamp across async work, renewed on next request; injected clock, no database.');
})().catch(error=>{console.error(error);process.exitCode=1;});
