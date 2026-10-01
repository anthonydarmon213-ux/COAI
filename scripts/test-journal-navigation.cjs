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
  const progress=fs.readFileSync('src/app/(app)/suivi/progression/page.tsx','utf8');
  assert.ok(progress.includes('href="/suivi/mesures"'));
  assert.ok(progress.includes('href="/suivi/seances#historique-seances"'));
  console.log('PASS: rendered journal anchors, form, timed holds, dynamic exercise metrics and progress destinations');
})().catch(e=>{console.error(e);process.exitCode=1;});
