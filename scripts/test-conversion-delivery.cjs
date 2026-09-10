// Real consent, analytics, tracker and React component, SDK calls simulated.
const fs=require('node:fs');const vm=require('node:vm');
const assert=require('node:assert/strict');const ts=require('typescript');
const storage=new Map();const calls=[];const listeners=new Map();
const window={
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
  addEventListener:(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},
  removeEventListener:(name,fn)=>listeners.get(name)?.delete(fn),
  dispatchEvent:event=>{for(const fn of listeners.get(event.type)??[])fn();},
};
function load(file,deps={}) {
  const box={exports:{},window,Date,Event,require:name=>{assert.ok(name in deps,name);return deps[name];}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,box);
  return box.exports;
}
const consent=load('src/lib/analytics/consent.ts');
const analytics=load('src/lib/analytics.ts',{'./analytics/consent':consent});
const delivery=load('src/lib/analytics/conversion-delivery.ts',{'@/lib/analytics':analytics,'./consent':consent});
let cleanup;const ref={current:null};
const component=load('src/components/analytics/track-conversion.tsx',{
  react:{useRef:()=>ref,useEffect:fn=>{cleanup=fn();}},
  '@/lib/analytics/consent':consent,'@/lib/analytics/conversion-delivery':delivery,
});
const conversion={name:'checkout_completed',onceKey:'fictional-checkout',metaEvent:'StartTrial'};
component.TrackConversion(conversion);
assert.equal(calls.length,0);
consent.saveConsent({audience:true,marketing:false});
assert.equal(calls.length,0,'SDK absent must not consume the conversion');
window.gtag=(...args)=>calls.push(['GA',...args]);
window.dispatchEvent(new Event(delivery.ANALYTICS_READY_EVENT));
window.dispatchEvent(new Event(delivery.ANALYTICS_READY_EVENT));
assert.equal(calls.length,1);
assert.equal(storage.get('coai_conversion_checkout_completed_fictional-checkout_audience'),'1');
window.fbq=(...args)=>calls.push(['Meta',...args]);
window.dispatchEvent(new Event(delivery.ANALYTICS_READY_EVENT));
assert.equal(calls.length,1,'No marketing consent');
consent.saveConsent({audience:true,marketing:true});
assert.equal(calls.length,2,'Google marker must not suppress Meta');
assert.equal(storage.get('coai_conversion_checkout_completed_fictional-checkout_marketing'),'1');
cleanup();
assert.ok([...listeners.values()].every(set=>set.size===0));
delivery.createConversionTracker(conversion)();
assert.equal(calls.length,2,'Reload deduplicates both channels');
consent.saveConsent({audience:false,marketing:false});
delivery.createConversionTracker({...conversion,onceKey:'refused'})();
assert.equal(calls.length,2);
consent.saveConsent({audience:true,marketing:true});
storage.set('coai_conversion_checkout_completed_legacy','1');
delivery.createConversionTracker({...conversion,onceKey:'legacy'})();
assert.equal(calls.length,2,'Legacy receipt is not replayed');
// Repeated events without persistent key still count once per mount.
const view=delivery.createConversionTracker({name:'landing_viewed'});view();view();
assert.equal(calls.length,3);
// SDK failure is not marked as success, and does not affect the other channel.
window.gtag=()=>{throw Error('simulated SDK failure');};
const retry=delivery.createConversionTracker({...conversion,onceKey:'failed'});retry();
assert.equal(calls.length,4); // Meta only
window.gtag=(...args)=>calls.push(['GA',...args]);retry();retry();
assert.equal(calls.length,5);
window.localStorage.getItem=()=>{throw Error('blocked storage');};
assert.doesNotThrow(()=>delivery.createConversionTracker({...conversion,onceKey:'blocked'})());
assert.equal(calls.length,5);
console.log('PASS actual component events: late SDK, late consent, per-channel receipts, reload, legacy, cleanup, refusal, SDK/storage failures');
console.log('LIMIT: provider callbacks simulated; no GA4 or Meta network receipt proven');
