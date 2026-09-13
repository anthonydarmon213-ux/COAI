const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const api = {};
let value=20, state, effect;
const focus={current:false};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/suivi/repcount-stepper.tsx','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}
}).outputText,{exports:api,require:name=>name==='react'?{
  useId:()=> 'test-input', useRef:()=>focus,
  useState:initial=>[state??(state=initial),v=>state=v], useEffect:f=>effect=f,
}:name==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:require(name)});
const parse=api.lireValeur;
assert.equal(parse('12,75',0,10000,false),12.75);
assert.equal(parse('0',0,10000,false),0);
for(const raw of ['', '-1', 'NaN', 'Infinity','1e3','2.345','2,4,5']) assert.equal(parse(raw,0,10000,false),null,raw);
assert.equal(parse('2.5',1,10000,true),null);
assert.equal(parse('3601',1,3600,true),null);
const all=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(all):[n,...all(n.props?.children)];
const render=()=>api.RepCountStepper({label:'Charge',valeur:value,setValeur:v=>value=v,pas:2.5,unite:'kg'});
const input=()=>all(render()).find(n=>n.type==='input');
input().props.onFocus({currentTarget:{select(){}}});
input().props.onChange({target:{value:'12,'}});
render(); effect(); // Simulates a parent update during the rest timer.
assert.equal(input().props.value,'12,','Partial decimal must survive parent update');
input().props.onChange({target:{value:'12,75'}});
assert.equal(value,12.75);
input().props.onBlur();
assert.equal(input().props.value,'12.75');
all(render()).find(n=>n.props?.['aria-label']==='Augmenter Charge').props.onClick();
assert.equal(value,15.25,'Keep quarter-kilogram precision');
input().props.onChange({target:{value:''}});
assert.equal(input().props['aria-invalid'],true);
input().props.onBlur();
assert.equal(input().props.value,'15.25');
console.log('PASS RepCount numeric input: French decimals, integers, bounds, timer rerender, blur, precision');
