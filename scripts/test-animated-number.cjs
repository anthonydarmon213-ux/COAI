// Hook réel avec horloge/frames et hooks simulés ; SSR avec React réel.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript'),React=require('react');
const source=fs.readFileSync('src/components/ui/use-animated-number.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function load(react,globals={}) {
  const exports={};vm.runInNewContext(code,{exports,require:name=>{assert.equal(name,'react');return react;},...globals});return exports;
}
const server=load(React);
function Counter(){return React.createElement('span',null,server.useAnimatedNumber(80));}
assert.equal(require('react-dom/server').renderToStaticMarkup(React.createElement(Counter)),'<span>80</span>');
let reduced=false,now=0,state,dependencies,cleanup,pending,notify,unsubscribe,frameID=0;
const frames=new Map(),listeners=new Set();
const query={get matches(){return reduced;},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
const api=load({
  useState:initial=>[state??(state=initial),next=>{state=next;}],
  useSyncExternalStore:(subscribe,read)=>{if(!unsubscribe)unsubscribe=subscribe(()=>{notify=true;});return read();},
  useEffect:(effect,deps)=>{if(!dependencies||deps.some((v,i)=>!Object.is(v,dependencies[i])))pending=()=>{cleanup?.();dependencies=deps;cleanup=effect();};},
},{window:{matchMedia:()=>query},performance:{now:()=>now},
  requestAnimationFrame:fn=>{frames.set(++frameID,fn);return frameID;},cancelAnimationFrame:id=>frames.delete(id)});
function render(target=80,duration=1000){const value=api.useAnimatedNumber(target,duration);pending?.();pending=null;return value;}
function tick(time){now=time;const [id,fn]=frames.entries().next().value;frames.delete(id);fn(now);}
assert.equal(render(),0);assert.equal(frames.size,1);
tick(500);assert.equal(render(),70);
reduced=true;listeners.forEach(fn=>fn());assert.equal(notify,true);
assert.equal(render(),80);assert.equal(frames.size,0,'Preference change cancels animation');
assert.equal(render(120),120,'Reduced motion shows updated target immediately');
reduced=false;listeners.forEach(fn=>fn());assert.equal(render(120),0);
tick(1500);assert.equal(render(120),120);assert.equal(frames.size,0);
assert.equal(render(20),0,'Old target is not shown after target change');
assert.equal(frames.size,1);cleanup();assert.equal(frames.size,0,'Unmount cancels pending frame');
unsubscribe();assert.equal(listeners.size,0,'Unmount removes media query listener');
console.log('PASS animated number: real SSR, count-up, live reduced motion, new target, completion and cleanup. Client clock/hooks simulated.');
