const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const source = ts.transpileModule(fs.readFileSync('src/lib/native/session-ended.ts','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function run(window) {
  const box = { exports: {}, ...(window === undefined ? {} : { window }) };
  vm.runInNewContext(source, box);
  box.exports.notifyNativeSessionEnded();
}
run(); run({}); run({webkit:{}}); run({webkit:{messageHandlers:{}}});
const messages=[];
run({webkit:{messageHandlers:{coaiSessionEnded:{postMessage:value=>messages.push(value)}}}});
assert.deepEqual(messages,['session-ended-v1']);
assert.doesNotThrow(()=>run({webkit:{messageHandlers:{coaiSessionEnded:{postMessage:()=>{throw Error('unavailable');}}}}}));
console.log('PASS: no-op on web/SSR, exact token-free native signal, native failure does not undo confirmed logout.');
