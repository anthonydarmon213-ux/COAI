const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/diagnostic/progress-storage.ts', 'utf8');
const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
const data = new Map();
const window = new EventTarget();
window.localStorage = {
  getItem: key => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, value),
  removeItem: key => data.delete(key),
};
const box = {exports: {}, window, Event};
vm.runInNewContext(code, box);
const api = box.exports;
const key = 'coai_diagnostic_progress';
assert.equal(api.serverDiagnosticProgressStep(), null);
assert.equal(api.diagnosticProgressStep(), null);
let changes = 0;
const unsubscribe = api.subscribeDiagnosticProgress(() => changes++);
api.saveDiagnosticProgress({step: 'niveau', prenom: 'Test', equipement: ['Banc']});
assert.equal(changes, 1);
assert.equal(api.diagnosticProgressStep(), 'niveau');
assert.equal(api.diagnosticProgressStep(), api.diagnosticProgressStep());
assert.equal(api.readDiagnosticProgress().prenom, 'Test');
assert.equal(api.readDiagnosticProgress().equipement[0], 'Banc');
function storageEvent(value) {
  const event = new Event('storage');
  Object.defineProperty(event, 'key', {value});
  window.dispatchEvent(event);
}
storageEvent('unrelated'); assert.equal(changes, 1);
storageEvent(key); assert.equal(changes, 2);
storageEvent(null); assert.equal(changes, 3);
window.dispatchEvent(new Event('pageshow')); assert.equal(changes, 4);
api.clearDiagnosticProgress(); assert.equal(changes, 5);
assert.equal(api.diagnosticProgressStep(), null);
unsubscribe();
api.saveDiagnosticProgress({step: 'objectif'});
storageEvent(key); window.dispatchEvent(new Event('pageshow'));
assert.equal(changes, 5, 'Every subscription must be removed');
for (const invalid of ['{broken', 'null', '[]', '12', 'true', '"niveau"']) {
  data.set(key, invalid);
  assert.equal(api.readDiagnosticProgress(), null);
  assert.equal(api.diagnosticProgressStep(), null);
}
data.set(key, '{"step":42}'); assert.equal(api.diagnosticProgressStep(), null);
window.localStorage = new Proxy({}, {get() {throw new Error('Storage unavailable');}});
assert.equal(api.diagnosticProgressStep(), null);
assert.doesNotThrow(() => api.saveDiagnosticProgress({step: 'niveau'}));
assert.doesNotThrow(() => api.clearDiagnosticProgress());
const server = {exports: {}};
vm.runInNewContext(code, server);
assert.equal(server.exports.diagnosticProgressStep(), null);
assert.equal(server.exports.serverDiagnosticProgressStep(), null);
console.log('PASS diagnostic storage: save/read, stable step, same-tab updates, cross-tab filtering, pageshow, cleanup, invalid data, denied storage, SSR. Browser events/storage simulated; not device E2E.');
