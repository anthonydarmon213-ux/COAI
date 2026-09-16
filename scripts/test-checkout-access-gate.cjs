// Actual component/effect; providers and timers simulated. No payment or network.
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const source = ts.transpileModule(fs.readFileSync('src/components/onboarding/checkout-access-gate.tsx','utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},
}).outputText;
function fixture(provider) {
  const values=[], effects=[], timers=[], calls=[]; let cursor=0;
  const deps={
    'react/jsx-runtime':require('react/jsx-runtime'),
    react:{useEffect:fn=>effects.push(fn),useState:initial=>{
      const index=cursor++; if(!(index in values))values[index]=initial;
      return [values[index],value=>{values[index]=typeof value==='function'?value(values[index]):value;}];
    }},
    'next/link':{default:({children,...props})=>React.createElement('a',props,children)},
  };
  const box={exports:{},AbortController, Error,
    setTimeout:(fn,ms)=>{assert.equal(ms,15000);timers.push(fn);return timers.length;}, clearTimeout:()=>{},
    fetch:async(url,options)=>{assert.equal(url,'/api/stripe/confirm-session');assert.equal(options.method,'POST');calls.push(JSON.parse(options.body));return provider(options);},
    require:name=>{assert(name in deps,name);return deps[name];},
  };
  vm.runInNewContext(source,box);
  const render=(sessionId='cs_fixture')=>{cursor=0;return box.exports.CheckoutAccessGate({sessionId,children:React.createElement('div',null,'ESSAI ACTIVE ET BILAN')});};
  return {render, effects, timers, calls, values};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const response=(body,ok=true)=>({ok,json:async()=>body});
(async()=>{
  for(const [body,ok,expected] of [
    [{confirmed:true,accessActive:true},true,'active'],
    [{confirmed:true,accessActive:false},true,'inactive'],
    [{confirmed:true},true,'error'],
    [{confirmed:true,accessActive:true},false,'error'],
    [null,true,'error'],
  ]) {
    const f=fixture(()=>response(body,ok));
    const initial=renderToStaticMarkup(f.render());
    assert(initial.includes('Nous activons ton accès'));
    assert(!initial.includes('ESSAI ACTIVE'));
    const cleanup=f.effects[0]();await flush();
    assert.equal(f.values[0].status,expected);
    assert.equal(f.calls[0].sessionId,'cs_fixture');
    const html=renderToStaticMarkup(f.render());
    assert.equal(html.includes('ESSAI ACTIVE'),expected==='active');
    if(expected==='error') {assert(html.includes('Réessayer'));assert(!html.includes('/pricing'));}
    assert(!renderToStaticMarkup(f.render('cs_another')).includes('ESSAI ACTIVE'),'Changing session must not reuse previous success');
    cleanup();
  }
  const network=fixture(()=>{throw Error('offline');});network.render();network.effects[0]();await flush();
  assert.equal(network.values[0].status,'error');
  const timeout=fixture(({signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout')))));
  timeout.render();timeout.effects[0]();timeout.timers[0]();await flush();assert.equal(timeout.values[0].status,'error');
  let finish;
  const unmounted=fixture(()=>new Promise(resolve=>{finish=resolve;}));unmounted.render();const cleanup=unmounted.effects[0]();cleanup();
  finish(response({confirmed:true,accessActive:true}));await flush();assert.equal(unmounted.values[0].status,'checking');
  // Retry button starts a new request, not a payment or program generation.
  let attempts=0;
  const retry=fixture(()=>response({confirmed:true,accessActive:++attempts>1},attempts>1));
  retry.render();retry.effects[0]();await flush();
  const tree=retry.render();const button=React.Children.toArray(tree.props.children).find(node=>node?.type==='button');
  assert(button);button.props.onClick();assert.equal(retry.values[0].status,'checking');assert.equal(retry.values[1],1);
  retry.render();retry.effects.at(-1)();await flush();assert.equal(retry.values[0].status,'active');
  assert.equal(retry.calls.length,2);
  console.log('PASS real access gate: checking/success/inactive/error, malformed response, network/timeout, unmount, session change, manual retry. No profile dependency, payment or generation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
