const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const api = {};
let fire, cleared = 0, calls = 0;
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/suivi/request-deadline.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: api, AbortController,
  setTimeout: callback => { fire = callback; return 1; },
  clearTimeout: () => { cleared++; }
});
(async () => {
  assert.equal(await api.withRequestDeadline(async signal => { assert.equal(signal.aborted, false); return 42; }), 42);
  assert.equal(cleared, 1);
  const failure = new Error('network');
  await assert.rejects(api.withRequestDeadline(async () => { throw failure; }), error => error === failure);
  assert.equal(cleared, 2);
  const pending = api.withRequestDeadline(signal => {
    calls++;
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  });
  const rejected = assert.rejects(pending, /aborted/);
  fire();
  await rejected;
  assert.equal(calls, 1, 'no automatic retry');
  assert.equal(cleared, 3);
  console.log('PASS request deadline: success, network failure, abort, cleanup, no automatic retry');
})().catch(error => { console.error(error); process.exitCode = 1; });
