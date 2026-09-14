const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const sandbox = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/suivi/progression-force.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, sandbox);
const calculate = sessions => JSON.parse(JSON.stringify([...sandbox.exports.progressionForce(sessions)]));
const session = exercices => ({exercices});
assert.deepEqual(calculate([session([{nom:'Squat',sets:[{reps:10,charge:20},{reps:8,charge:25}]}])]), [['Squat',[25]]]);
assert.deepEqual(calculate([session([{nom:'Squat',chargeKg:80}]),session([{nom:'Squat',sets:[{reps:8,charge:60}]},{nom:'Squat',sets:[{reps:3,charge:70}]}])]), [['Squat',[80,70]]]);
assert.deepEqual(calculate([session([{nom:'Squat',chargeKg:100,sets:[{reps:5,charge:25}]},{nom:'Squat haltères',chargeKg:20}])]), [['Squat',[25]],['Squat haltères',[20]]]);
assert.deepEqual(calculate([session([null,{nom:' ',chargeKg:50},{nom:'A',sets:[null,{reps:0,charge:50},{reps:2,charge:Infinity},{reps:3,charge:-2}]},{nom:'B',chargeKg:NaN},{nom:'C',chargeKg:0}]),session(null)]), []);
assert.deepEqual(calculate([session([{nom:'Legacy',chargeKg:30,sets:[]}])]), [['Legacy',[30]]]);
const jsx = { jsx:(type,props)=>({type,props}), jsxs:(type,props)=>({type,props}) };
const cta = {exports:{},require:id=>id==='react/jsx-runtime'?jsx:id==='next/link'?{default:'a'}:id==='@/lib/whatsapp'?{buildWhatsAppLink:text=>'https://wa.me/test?text='+encodeURIComponent(text)}: (()=>{throw Error(id)})()};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/suivi/coaching-visio-cta.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,cta);
for(const plan of [undefined,'PASS_IA','STANDARD']){
 const rendered=JSON.stringify(cta.exports.CoachingVisioCta({plan}));
 assert.ok(rendered.includes('/club') && rendered.includes('sans replay'));
 assert.ok(!decodeURIComponent(rendered).includes('je suis abonné'));
 assert.ok(!rendered.includes('Organiser mes séances VIP'));
}
assert.ok(JSON.stringify(cta.exports.CoachingVisioCta({plan:'PREMIUM'})).includes('Organiser mes séances VIP'));
console.log('OK: force RepCount/legacy, maxima per session, invalid data, Club and VIP');
