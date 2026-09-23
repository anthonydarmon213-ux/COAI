// Component event test with an isolated API stub: never writes a real account.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const states = [], refs = [];
let si=0, ri=0, fail='timeout';
let onboarding=false;
const requests=[];
const storage = new Map();
let effects=[];
let storageBlocked=false;
function load(file, resolver) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
    exports, require:resolver, window:{localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(storageBlocked)throw new Error('quota');storage.set(k,v);},removeItem:k=>storage.delete(k)}}, document:{getElementById:()=>({focus(){}})},
    AbortController, setTimeout, clearTimeout,
    fetch:async(url,options)=>{
      if(!options?.method) return {ok:true,json:async()=>[]};
      requests.push(JSON.parse(options.body));
      if(fail==='timeout') return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('request aborted'))));
      if(fail==='html') return new Response('<html>Connexion</html>',{status:200});
      if(fail==='empty') return new Response('{}',{status:200});
      if(fail==='wrong-date') return Response.json({id:'saved',source:'REPCOUNT',date:'2000-01-01T00:00:00Z'});
      if(fail==='wrong-source') return Response.json({id:'saved',source:'PROGRAMME',date:requests.at(-1).date});
      if(fail) throw new Error('connection lost');
      return Response.json({id:'saved',source:'REPCOUNT',date:requests.at(-1).date});
    }
  });
  return exports;
}
const history=load('src/lib/suivi/historique-exercice.ts',require);
const session=load('src/lib/suivi/repcount-session.ts',require);
const draft=load('src/lib/suivi/repcount-draft.ts',require);
const deadline=load('src/lib/suivi/request-deadline.ts',require);
const component=load('src/components/suivi/repcount.tsx',name=>{
  if(name==='react') return {
    useState:initial=>{const index=si++; if(!(index in states))states[index]=initial; return [states[index],value=>states[index]=typeof value==='function'?value(states[index]):value];},
    useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),
    useEffect:f=>effects.push(f),useCallback:f=>f,useMemo:f=>f(),useSyncExternalStore:(_subscribe,snapshot)=>snapshot()
  };
  if(name==='react/jsx-runtime') return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='@/lib/suivi/historique-exercice') return history;
  if(name==='@/lib/suivi/repcount-session') return session;
  if(name==='@/lib/suivi/repcount-draft') return draft;
  if(name==='@/lib/suivi/request-deadline') return {withRequestDeadline:operation=>deadline.withRequestDeadline(operation,10)};
  if(name==='@/lib/analytics/first-saved-conversion')return {firstSavedConversionId:async()=>null};
  return {};
});
function render(){si=0;ri=0;effects=[];return component.RepCount({exercices:[],hasAccess:true,userId:'test-user',onboarding});}
function all(node){if(!node)return [];if(Array.isArray(node))return node.flatMap(all);if(typeof node!=='object')return [];return [node,...all(node.props?.children)];}
function text(node){if(Array.isArray(node))return node.map(text).join('');if(typeof node==='object'&&node)return text(node.props?.children);return node??'';}
function button(label){return all(render()).find(n=>n.type==='button'&&text(n)===label);}
function input(id){return all(render()).find(n=>n.props?.id===id);}
(async()=>{
  // A delayed history result must not overwrite manual input or change its unit.
  for (const action of ['untouched','focus','charge','reps','mode','duration']) {
    states.length=0;refs.length=0;
    input('repcount-exercice').props.onChange({target:{value:'Presse à cuisses'}});
    if(action==='mode'||action==='duration') {
      all(render()).find(n=>n.type==='select').props.onChange({target:{value:'maintien'}});
    }
    if(['focus','charge','reps','duration'].includes(action)) {
      const label=action==='reps'?'Répétitions':action==='duration'?'Maintien':'Charge';
      const stepper=all(render()).find(n=>n.props?.label===label);
      stepper.props.onInteraction();
      if(action!=='focus')stepper.props.setValeur(action==='reps'?7:action==='duration'?45:12.5);
    }
    states[6]=[{date:'2026-09-01T12:00:00Z',exercices:[{nom:'Presse à cuisses',sets:[{set:1,reps:15,charge:80}]}]}];
    render();effects[3]();
    if(action==='untouched') {assert.equal(states[1],15);assert.equal(states[2],80);}
    else {
      assert.equal(states[1],action==='reps'?7:10);
      assert.equal(states[2],action==='charge'?12.5:20);
      assert.equal(states[3],action==='mode'||action==='duration');
      if(action==='duration')assert.equal(states[4],45);
    }
  }
  states.length=0;refs.length=0;
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
  assert.ok(text(render()).includes("La sauvegarde n’a pas pu être confirmée"));
  const raw = storage.get(draft.draftKey('test-user'));
  assert.ok(draft.parseDraft(raw));
  const ancien=JSON.parse(raw); delete ancien.routine;
  assert.equal(draft.parseDraft(JSON.stringify(ancien)).routine.length,0,'Existing drafts remain readable');
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
  // Reuse the sequence, not logged sets or notes. Never write until save.
  states[6]=[{date:requests[0].date,exercices:requests[0].exercices}];
  button('Reprendre ces exercices').props.onClick();
  assert.equal(states[0],'Presse à cuisses');
  assert.equal(states[5].length,0);
  assert.equal(states[7].length,0);
  assert.equal(states[8],'');
  assert.equal(button('Terminer et enregistrer la séance'),undefined);
  assert.equal(button('Reprendre ces exercices').props.disabled,true);
  render(); effects[1]();
  assert.equal(draft.parseDraft(storage.get(draft.draftKey('test-user'))).routine.length,2);
  states.length=0; refs.length=0; render(); effects[0](); render();
  assert.equal(states[19].length,2,'Planned sequence survives remount');
  button('Valider la série').props.onClick();
  button('Ajouter un autre exercice →').props.onClick();
  assert.equal(states[0],'Tirage horizontal');
  assert.equal(states[5].length,0,'Next exercise is not already performed');
  assert.equal(states[7].length,1);
  assert.equal(requests.length,2,'Starting a routine must not create history');
  button('Continuer en séance libre').props.onClick();
  assert.equal(states[7].length,1,'Leaving the sequence preserves completed work');
  assert.equal(states[19].length,0);
  // First-use shortcut must become a real editable series before any network wait.
  states.length=0; refs.length=0; storage.clear(); onboarding=true; fail='timeout';
  input('repcount-exercice').props.onChange({target:{value:'Presse à cuisses'}});
  await button('Enregistrer mon premier repère →').props.onClick();
  assert.equal(states[5].length,1,'Failed first save remains visible in editor');
  render(); effects[0](); render(); effects[1]();
  const firstDraft=draft.parseDraft(storage.get(draft.draftKey('test-user')));
  assert.equal(firstDraft.sets.length,1,'Draft effect must not erase first series');
  const previous=requests.at(-1);
  fail=false;
  await button('Terminer et enregistrer la séance').props.onClick();
  assert.deepEqual(requests.at(-1),previous,'First-use retry keeps same transaction identity');
  assert.ok(text(render()).includes('Premier repère posé ✓'));
  for (const response of ['html','empty','wrong-date','wrong-source']) {
    states.length=0; refs.length=0; storage.clear(); onboarding=false; fail=response;
    input('repcount-exercice').props.onChange({target:{value:'Presse à cuisses'}});
    button('Valider la série').props.onClick();
    await button('Terminer et enregistrer la séance').props.onClick();
    assert.equal(states[5].length,1,response+' must retain the unsaved series');
    assert.ok(text(render()).includes('La sauvegarde n’a pas pu être confirmée'));
    const previous=requests.at(-1);
    fail=false;
    await button('Terminer et enregistrer la séance').props.onClick();
    assert.deepEqual(requests.at(-1),previous,'Ambiguous response retry keeps identity');
    assert.ok(text(render()).includes('Séance enregistrée ✓'));
  }
  console.log('PASS RepCount workflow: timed-out save and first-use shortcut preserve series and identical retry; restore, account isolation, sequence reuse');
})().catch(error=>{console.error(error);process.exitCode=1;});
