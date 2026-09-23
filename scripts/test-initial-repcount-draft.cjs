const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const out = {}, parser = {}, storage = new Map();
let reads = 0, denied = false;
const compile = file => ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(compile('src/lib/suivi/repcount-draft.ts'),{exports:parser,require});
vm.runInNewContext(compile('src/lib/suivi/initial-repcount-draft.ts'),{
  exports:out,require:()=>parser,
  window:{localStorage:{getItem:key=>{reads++;if(denied)throw Error('denied');return storage.get(key)??null;}}}
});
const a = out.createInitialRepCountDraft('a');
assert.equal(a.serverSnapshot(),null);
assert.equal(reads,0);
assert.equal(a.snapshot().restored,null);
assert.equal(a.snapshot(),a.snapshot());
assert.equal(reads,1,'Only initial read, not every render');
denied=true;
const b=out.createInitialRepCountDraft('b');
assert.equal(b.snapshot().failed,true);
assert.equal(a.snapshot().failed,false,'A separate editor retains its own result');
assert.equal(out.createInitialRepCountDraft().snapshot().failed,false,'Anonymous editor does not read storage');
denied=false;
storage.set(parser.draftKey('c'),'{invalid');
assert.equal(out.createInitialRepCountDraft('c').snapshot().restored,null);
assert.equal(typeof a.subscribe()(),'undefined');
console.log('PASS initial draft: server without browser read, stable one-shot snapshot, isolated failures, anonymous and malformed storage.');
