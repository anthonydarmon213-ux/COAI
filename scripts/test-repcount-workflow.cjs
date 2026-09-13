// Component event test with an isolated API stub: never writes a real account.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const states = [], refs = [];
let si=0, ri=0, fail=true;
const requests=[];
const storage = new Map();
let effects=[];
let storageBlocked=false;
function load(file, resolver) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
    exports, require:resolver, window:{localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(storageBlocked)throw new Error('quota');storage.set(k,v);},removeItem:k=>storage.delete(k)}}, document:{getElementById:()=>({focus(){}})},
    fetch:async(url,options)=>{
      if(!options) return {ok:true,json:async()=>[]};
      requests.push(JSON.parse(options.body));
      if(fail) throw new Error('connection lost');
      return {ok:true};
    }
  });
  return exports;
}
const history=load('src/lib/suivi/historique-exercice.ts',require);
const session=load('src/lib/suivi/repcount-session.ts',require);
const draft=load('src/lib/suivi/repcount-draft.ts',require);
const component=load('src/components/suivi/repcount.tsx',name=>{
  if(name==='react') return {
    useState:initial=>{const index=si++; if(!(index in states))states[index]=initial; return [states[index],value=>states[index]=typeof value==='function'?value(states[index]):value];},
    useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),
    useEffect:f=>effects.push(f),useCallback:f=>f,useMemo:f=>f()
  };
  if(name==='react/jsx-runtime') return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='@/lib/suivi/historique-exercice') return history;
  if(name==='@/lib/suivi/repcount-session') return session;
  if(name==='@/lib/suivi/repcount-draft') return draft;
  if(name==='@/lib/analytics/first-saved-conversion')return {firstSavedConversionId:async()=>null};
  return {};
});
function render(){si=0;ri=0;effects=[];return component.RepCount({exercices:[],hasAccess:true,userId:'test-user'});}
function all(node){if(!node)return [];if(Array.isArray(node))return node.flatMap(all);if(typeof node!=='object')return [];return [node,...all(node.props?.children)];}
function text(node){if(Array.isArray(node))return node.map(text).join('');if(typeof node==='object'&&node)return text(node.props?.children);return node??'';}
function button(label){return all(render()).find(n=>n.type==='button'&&text(n)===label);}
function input(id){return all(render()).find(n=>n.props?.id===id);}
(async()=>{
  input('repcount-exercice').props.onChange({target:{value:'Presse à cuisses'}});
  button('Valider la série').props.onClick();
  button('Ajouter un autre exercice →').props.onClick();
  input('repcount-exercice').props.onChange({target:{value:'Tirage horizontal'}});
  button('Valider la série').props.onClick();
  input('repcount-notes').props.onChange({target:{value:'Réglage siège 3'}});
  await button('Terminer et enregistrer la séance').props.onClick();
  assert.equal(requests[0].exercices.length,2);
  assert.equal(requests[0].notes,'Réglage siège 3');
  assert.equal(requests[0].exercices[0].nom,'Presse à cuisses');
  assert.equal(requests[0].exercices[1].sets[0].set,1);
  assert.ok(text(render()).includes("L'enregistrement a échoué"));
  const raw = storage.get(draft.draftKey('test-user'));
  assert.ok(draft.parseDraft(raw));
  assert.equal(draft.parseDraft('{broken'),null);
  assert.equal(draft.parseDraft(raw,Date.now()+8*86400000),null);
  assert.equal(storage.get(draft.draftKey('other-user')),undefined);
  // Unmount/remount: execute restoration effect, preserving retry identity.
  states.length=0; refs.length=0; render(); effects[0](); render();
  assert.equal(states[7][0].nom,'Presse à cuisses');
  assert.equal(states[8],'Réglage siège 3');
  storageBlocked=true; effects[1]();
  assert.ok(text(render()).includes('Brouillon non conservé'));
  assert.equal(states[8],'Réglage siège 3','Storage failure must not discard working data');
  storageBlocked=false;
  fail=false;
  await button('Terminer et enregistrer la séance').props.onClick();
  assert.deepEqual(requests[0],requests[1], 'Retry must reuse payload and idempotency date');
  assert.ok(text(render()).includes('Séance enregistrée ✓'));
  assert.equal(button('Terminer et enregistrer la séance'),undefined);
  effects[1]();
  assert.equal(storage.has(draft.draftKey('test-user')),false);
  console.log('PASS RepCount workflow: two exercises, restore after remount, account isolation, expiry, invalid data, storage failure, identical retry, success clears draft');
})().catch(error=>{console.error(error);process.exitCode=1;});
