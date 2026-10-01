const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const api = {}, states = [], refs = [];
let si=0, ri=0, status=500, confirmed=false, calls=0, downloads=0, pushes=0, hold;
let responseBody={id:'local-export-user',profile:{}}, badJson=false, networkFailure=false, confirmationText='', nativeCleanups=0;
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
    if(name==='@/lib/native/session-ended')return {notifyNativeSessionEnded:()=>nativeCleanups++};
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
  status=200;
  for (const value of [null, [], {}, {error:'unavailable'}, {id:''}, {id:42}]) {
    responseBody=value;
    await button('Exporter mes données').props.onClick();
    assert.equal(downloads,0,'An invalid export must never become a downloaded file');
    assert.ok(label(render()).includes('L’export n’a pas abouti'));
    assert.equal(button('Exporter mes données').props.disabled,false);
  }
  responseBody={id:'local-export-user',profile:{}};
  const before=calls; await button('Supprimer mon compte').props.onClick();
  assert.equal(calls,before,'Cancellation must not send deletion');
  assert.match(confirmationText,/facturation continuera/);
  confirmed=true;status=500;await button('Supprimer mon compte').props.onClick();
  assert.equal(pushes,0);assert.ok(label(render()).includes('suppression n’a pas pu être confirmée'));
  assert.equal(button('Supprimer mon compte').props.disabled,false);
  status=503;responseBody={code:'PHOTO_DELETION_UNCONFIRMED',error:'PRIVATE_PROVIDER_DETAIL'};
  await button('Supprimer mon compte').props.onClick();
  assert.ok(label(render()).includes('nouveaux envois bloqués par sécurité'));
  assert.ok(label(render()).includes('Ton compte n’est pas supprimé'));
  assert.ok(!label(render()).includes('PRIVATE_PROVIDER_DETAIL'));
  assert.equal(pushes,0);assert.equal(nativeCleanups,0);
  assert.equal(button('Supprimer mon compte').props.disabled,false);
  for (const body of [null, [], {}, {code:'unknown',error:'PRIVATE_PROVIDER_DETAIL'}]) {
    responseBody=body;await button('Supprimer mon compte').props.onClick();
    assert.ok(label(render()).includes('suppression n’a pas pu être confirmée'));
    assert.ok(!label(render()).includes('PRIVATE_PROVIDER_DETAIL'));
  }
  badJson=true;await button('Supprimer mon compte').props.onClick();badJson=false;
  assert.ok(label(render()).includes('suppression n’a pas pu être confirmée'));
  responseBody={id:'local-export-user',profile:{}};
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
  assert.equal(nativeCleanups,0,'Failures/cancellation must not clear the native session');
  const action=button('Supprimer mon compte').props.onClick;
  await action();assert.equal(pushes,1);
  assert.equal(nativeCleanups,1,'Confirmed deletion clears native state once');
  assert.equal(button('Suppression…').props.disabled,true);
  const afterSuccess=calls;await action();assert.equal(calls,afterSuccess,'No repeated deletion during navigation');
  assert.equal(nativeCleanups,1);
  console.log('PASS account actions: error messages, no fake export, cancellation, duplicate guard, recovery and success (mock API only)');
})().catch(error=>{console.error(error);process.exitCode=1;});
