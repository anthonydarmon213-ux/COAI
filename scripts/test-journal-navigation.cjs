const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const jsx = {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const modules = {
  'react/jsx-runtime': jsx,
  '@/lib/auth/server': {getCurrentAppUser:async()=>({id:'local-test'})},
  '@/lib/suivi/workout-history': {workoutHistory:async()=>[
    {id:'timed',date:new Date('2026-10-01T10:00:00Z'),exercices:[
      {nom:'Gainage planche',series:1,sets:[{reps:0,charge:0,dureeSecondes:45}]},
      {nom:'Squat barre',series:1,sets:[{reps:10,charge:20}]},
    ]},
  ]},
  '@/lib/exercices/catalogue': {EXERCICES:[]},
  '@/lib/exercices/media-coai': {exerciceAvecMediasCoai:()=>true},
};
const sandbox={exports:{},require:id=>modules[id]??new Proxy({}, {get:(_target,key)=>String(key)})};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/(app)/suivi/seances/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,sandbox);
(async()=>{
  const tree=await sandbox.exports.default(); const nodes=[];
  function walk(node){if(Array.isArray(node))return node.forEach(walk);if(!node||typeof node!=='object')return;nodes.push(node);walk(node.props?.children);}
  walk(tree);
  for(const target of ['saisir-seance','historique-seances']){
    assert.equal(nodes.filter(n=>n.props?.id===target).length,1);
    assert.ok(nodes.some(n=>n.type==='a'&&n.props.href==='#'+target));
    assert.ok(nodes.some(n=>n.type==='h2'&&n.props.id===target&&n.props.tabIndex===-1));
  }
  assert.ok(nodes.some(n=>n.type==='SeanceForm'));
  function content(node) {
    if (Array.isArray(node)) return node.map(content).join('');
    if (node && typeof node === 'object') return content(node.props?.children);
    return node == null ? '' : String(node);
  }
  const rendered = content(tree);
  assert.ok(rendered.includes('45 s de maintien'), 'The journal must preserve the actual timed exercise metric');
  assert.ok(!rendered.includes('0×0kg'), 'A timed hold must not be presented as zero repetitions at zero weight');
  assert.ok(!rendered.includes('0 × 0 kg'));
  assert.ok(rendered.includes('10 × 20 kg'), 'Dynamic exercise metrics are unchanged');
  assert.ok(!rendered.includes('Certains détails'), 'Valid workouts must not be flagged as damaged');
  modules['@/lib/suivi/workout-history'].workoutHistory = async () => [{
    id:'legacy',date:new Date('2026-10-01T10:00:00Z'),exercices:[
      null, {nom:42}, {nom:'Squat valide',sets:[null,{reps:10,charge:20},{reps:-5,charge:20}]},
      {nom:'Maintien valide',sets:[{dureeSecondes:45}]},
      {nom:'Ancien exercice',series:3,repetitions:8,chargeKg:10},
      {nom:'Séries illisibles',sets:'invalid'},
      {nom:'Dépassement',sets:[{reps:1e308,charge:1e308}]},
    ],
  }];
  const legacy = content(await sandbox.exports.default());
  assert.ok(legacy.includes('Squat valide'));
  assert.ok(legacy.includes('45 s de maintien'));
  assert.ok(legacy.includes('440 kg'), 'Preserve valid current and legacy tonnage only');
  assert.ok(legacy.includes('Certains détails de cette séance sont incomplets'));
  assert.ok(!legacy.includes('Infinity') && !legacy.includes('NaN') && !legacy.includes('-5 ×'));
  const progress=fs.readFileSync('src/app/(app)/suivi/progression/page.tsx','utf8');
  assert.ok(progress.includes('href="/suivi/mesures"'));
  assert.ok(progress.includes('href="/suivi/seances#historique-seances"'));
  console.log('PASS: rendered journal anchors, form, timed holds, dynamic exercise metrics and progress destinations');
})().catch(e=>{console.error(e);process.exitCode=1;});
