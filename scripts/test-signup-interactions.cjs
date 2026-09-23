// Code réel, hooks et fournisseur simulés. Aucun compte créé, aucun email envoyé.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const source = fs.readFileSync('src/app/(auth)/sign-up/page.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
function setup() {
  let cursor=0, stored='diagnostic@example.test', query='', server=false, calls=0, settle, rejectRequest;
  const slots=[], listeners=new Map(), cleanups=[];
  const location={origin:'http://localhost:3050',href:''};
  const mocks={
    react:{...React,
      useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;
        return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
      useRef:initial=>{const i=cursor++;return slots[i]??(slots[i]={current:initial});},
      useEffect:()=>{},
      useSyncExternalStore:(subscribe,read,ssr)=>{if(!server&&!cleanups.length)cleanups.push(subscribe(()=>{}));return server?ssr():read();},
    },
    'next/navigation':{useSearchParams:()=>new URLSearchParams(query)},
    'next/link':{default:'a'},
    '@/lib/diagnostic/storage':{readDiagnosticSignupEmail:()=>stored},
    '@/lib/auth/client':{createSupabaseBrowserClient:()=>({auth:{signUp:()=>{calls++;return new Promise((resolve,reject)=>{settle=resolve;rejectRequest=reject;});}}})},
    '@/lib/parrainage/cookie':{storeParrainageCookie(){}},
    '@/lib/checkout/intended-plan-cookie':{storeIntendedPlanCookie(){}},
    '@/lib/analytics/funnel-events':{trackFunnelEvent(){}},
  };
  for(const [file,name] of [['ui/button','Button'],['ui/input','Input'],['ui/field','Field'],['ui/card','Card'],['ui/section-label','SectionLabel'],['auth/social-sign-in-buttons','SocialSignInButtons'],['auth/confirmation-email','ConfirmationEmail']])mocks[`@/components/${file}`]={[name]:name};
  const exports={};
  vm.runInNewContext(compiled,{exports,URL,console:{error(){}},window:{location,
    addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)},
    require:name=>mocks[name]??require(name)});
  const render=()=>{cursor=0;return exports.default();};
  return {render,location,listeners,cleanups,get calls(){return calls;},resolve:value=>settle(value),reject:error=>rejectRequest(error),
    set stored(value){stored=value;},set query(value){query=value;},set server(value){server=value;}};
}
function find(node,predicate) {
  if(Array.isArray(node)){for(const child of node){const found=find(child,predicate);if(found)return found;}return;}
  if(!node?.props)return;
  if(predicate(node))return node;
  return find(node.props.children,predicate);
}
const email=tree=>find(tree,node=>node.type==='Input'&&node.props.type==='email');
const form=tree=>find(tree,node=>node.type==='form');
const event={preventDefault(){}};
(async()=>{
  const app=setup();app.server=true;
  assert.equal(email(app.render()).props.value,'','Rendu serveur sans stockage navigateur');
  app.server=false;assert.equal(email(app.render()).props.value,'diagnostic@example.test');
  app.query='email=url%40example.test';assert.equal(email(app.render()).props.value,'url@example.test');
  email(app.render()).props.onChange({target:{value:''}});
  app.stored='changed@example.test';assert.equal(email(app.render()).props.value,'','Effacement volontaire conservé');
  email(app.render()).props.onChange({target:{value:'edited@example.test'}});
  app.query='';assert.equal(email(app.render()).props.value,'edited@example.test');
  let submit=form(app.render()).props.onSubmit;
  const first=submit(event);await submit(event);assert.equal(app.calls,1);
  app.resolve({error:{code:'weak_password'},data:null});await first;
  assert(find(app.render(),node=>node.props.role==='alert'));
  submit=form(app.render()).props.onSubmit;
  const retry=submit(event);assert.equal(app.calls,2);
  app.resolve({error:null,data:{session:null}});await retry;
  await submit(event);assert.equal(app.calls,2,'Après succès, pas de deuxième inscription');
  assert(find(app.render(),node=>node.type==='ConfirmationEmail'));
  for(const cleanup of app.cleanups)cleanup();assert.equal(app.listeners.size,0);
  const direct=setup();const pending=form(direct.render()).props.onSubmit(event);
  direct.resolve({error:null,data:{session:{}}});await pending;
  assert(direct.location.href.startsWith('/completer-inscription?'));
  const offline=setup();const request=form(offline.render()).props.onSubmit(event);
  offline.reject(new Error('offline'));await request;
  assert(find(offline.render(),node=>node.props.role==='alert'));
  const recovered=form(offline.render()).props.onSubmit(event);assert.equal(offline.calls,2);
  offline.resolve({error:null,data:{session:null}});await recovered;
  console.log('PASS inscription : préremplissage SSR/client, priorité URL, saisie/effacement préservés, double appui, erreur/reprise, confirmation et redirection. Fournisseur simulé.');
})().catch(error=>{console.error(error);process.exitCode=1;});
