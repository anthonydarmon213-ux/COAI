const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const jsx = {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const modules = {
  'react/jsx-runtime': jsx,
  '@/lib/auth/server': {getCurrentAppUser:async()=>({id:'local-test'})},
  '@/lib/db/client': {prisma:{seanceLog:{findMany:async()=>[]}}},
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
  const progress=fs.readFileSync('src/app/(app)/suivi/progression/page.tsx','utf8');
  assert.ok(progress.includes('href="/suivi/mesures"'));
  assert.ok(progress.includes('href="/suivi/seances#historique-seances"'));
  console.log('PASS: rendered journal anchors, unique focusable headings, form preserved; progress destinations wired');
})().catch(e=>{console.error(e);process.exitCode=1;});
