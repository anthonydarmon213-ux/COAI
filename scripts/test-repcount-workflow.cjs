// Component event test with an isolated API stub: never writes a real account.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const states = [], refs = [];
let si=0, ri=0, fail=true;
const requests=[];
function load(file, resolver) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
    exports, require:resolver, document:{getElementById:()=>({focus(){}})},
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
const component=load('src/components/suivi/repcount.tsx',name=>{
  if(name==='react') return {
    useState:initial=>{const index=si++; if(!(index in states))states[index]=initial; return [states[index],value=>states[index]=typeof value==='function'?value(states[index]):value];},
    useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),
    useEffect:()=>{},useCallback:f=>f,useMemo:f=>f()
  };
  if(name==='react/jsx-runtime') return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='@/lib/suivi/historique-exercice') return history;
  if(name==='@/lib/suivi/repcount-session') return session;
  if(name==='@/lib/analytics/first-saved-conversion')return {firstSavedConversionId:async()=>null};
  return {};
});
function render(){si=0;ri=0;return component.RepCount({exercices:[],hasAccess:true});}
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
  fail=false;
  await button('Terminer et enregistrer la séance').props.onClick();
  assert.deepEqual(requests[0],requests[1], 'Retry must reuse payload and idempotency date');
  assert.ok(text(render()).includes('Séance enregistrée ✓'));
  assert.equal(button('Terminer et enregistrer la séance'),undefined);
  console.log('PASS RepCount workflow: two exercises, notes, failed save retained, identical retry, success clears draft');
})().catch(error=>{console.error(error);process.exitCode=1;});
