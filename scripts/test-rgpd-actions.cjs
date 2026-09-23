const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const api = {}, states = [], refs = [];
let si=0, ri=0, status=500, confirmed=false, calls=0, downloads=0, pushes=0, hold;
let responseBody={profile:{}}, badJson=false, networkFailure=false, confirmationText='';
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/components/compte/rgpd-actions.tsx'),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}
}).outputText, {exports:api, Error, Blob, setTimeout:fn=>fn(),
  URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
  confirm:text=>{confirmationText=text;return confirmed;},
  document:{body:{appendChild:()=>{}},createElement:()=>({click:()=>downloads++,remove:()=>{}})},
  fetch:async(url,options)=>{if(url==='/api/compte/delete')assert.equal(options.headers['X-COAI-Delete-Confirmation'],'1');calls++; if(hold) await hold;if(networkFailure)throw new Error('network'); return {ok:status===200,status,json:async()=>{if(badJson)throw new Error('json');return responseBody;}};},
  require:name=>{
    if(name==='react') return {
      useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return [states[i],v=>states[i]=v];},
      useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial})
    };
    if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
    if(name==='next/navigation')return {useRouter:()=>({replace:()=>pushes++,refresh:()=>{}})};
    if(name==='@/components/ui/button')return {Button:'button'};
    throw new Error(name);
  }
});
function render(){si=ri=0;return api.RgpdActions();}
function nodes(x){return !x||typeof x!=='object'?[]:Array.isArray(x)?x.flatMap(nodes):[x,...nodes(x.props?.children)];}
function label(x){return Array.isArray(x)?x.map(label).join(''):typeof x==='object'&&x?label(x.props?.children):x??'';}
function button(text){return nodes(render()).find(x=>x.type==='button'&&label(x)===text);}
(async()=>{
  const management=nodes(render()).find(x=>x.type==='a'&&x.props.href==='https://apps.apple.com/account/subscriptions');
  assert.ok(management,'Direct Apple subscription management must remain available');
  assert.ok(label(render()).includes('facturation continue'));
  assert.ok(label(render()).includes('supprimer ton compte immédiatement'));
  assert.equal(button('Supprimer mon compte').props['aria-describedby'],'account-deletion-billing');
  await button('Exporter mes données').props.onClick();
  assert.equal(downloads,0); assert.ok(nodes(render()).some(x=>x.props?.role==='alert'));
  status=401; await button('Exporter mes données').props.onClick();
  assert.ok(label(render()).includes('Reconnecte-toi'));assert.equal(downloads,0);
  const before=calls; await button('Supprimer mon compte').props.onClick();
  assert.equal(calls,before,'Cancellation must not send deletion');
  assert.match(confirmationText,/facturation continuera/);
  confirmed=true;status=500;await button('Supprimer mon compte').props.onClick();
  assert.equal(pushes,0);assert.ok(label(render()).includes('suppression n’a pas pu être confirmée'));
  assert.equal(button('Supprimer mon compte').props.disabled,false);
  status=200; let release;hold=new Promise(resolve=>release=resolve);
  const save=button('Exporter mes données').props.onClick();const count=calls;
  await button('Supprimer mon compte').props.onClick();assert.equal(calls,count,'No overlapping operation');
  release();await save;hold=null;assert.equal(downloads,1);
  for(const value of [null, {}, {success:false}, {success:'true'}, []]) {
    responseBody=value;
    await button('Supprimer mon compte').props.onClick();assert.equal(pushes,0);
    assert.equal(button('Supprimer mon compte').props.disabled,false);
  }
  responseBody={success:true};badJson=true;
  await button('Supprimer mon compte').props.onClick();assert.equal(pushes,0);
  badJson=false;networkFailure=true;
  await button('Supprimer mon compte').props.onClick();assert.equal(pushes,0);
  networkFailure=false;
  const action=button('Supprimer mon compte').props.onClick;
  await action();assert.equal(pushes,1);
  assert.equal(button('Suppression…').props.disabled,true);
  const afterSuccess=calls;await action();assert.equal(calls,afterSuccess,'No repeated deletion during navigation');
  console.log('PASS account actions: error messages, no fake export, cancellation, duplicate guard, recovery and success (mock API only)');
})().catch(error=>{console.error(error);process.exitCode=1;});
