const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const api={}; let open=false;
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/dashboard/dashboard-intro-video.tsx','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}
}).outputText,{exports:api,require:name=>name==='react'?{useState:()=>[open,value=>open=value]}:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}});
const all=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(all):[n,...all(n.props?.children)];
api.markDashboardIntroPending(); // Must not depend on localStorage permission.
assert.equal(all(api.DashboardIntroVideo()).some(n=>n.type==='video'),false);
api.DashboardIntroVideo().props.onToggle({currentTarget:{open:true}});
const video=all(api.DashboardIntroVideo()).find(n=>n.type==='video');
assert.equal(video.props.controls,true);
assert.equal(video.props.preload,'none');
assert.equal(video.props.autoPlay,undefined);
assert.equal(all(api.DashboardIntroVideo()).some(n=>n.props?.role==='dialog'),false);
api.DashboardIntroVideo().props.onToggle({currentTarget:{open:false}});
assert.equal(all(api.DashboardIntroVideo()).some(n=>n.type==='video'),false);
console.log('PASS dashboard intro: optional, no autoplay or blocking overlay, native controls, unmount on close');
