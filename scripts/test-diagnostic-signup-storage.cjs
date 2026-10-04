const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/lib/diagnostic/storage.ts'), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function storage() {
  const data = new Map();
  return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
}
function load(window) {
  const exports = {};
  vm.runInNewContext(code, {exports,...(window?{window}:{})});
  return exports;
}
const browser = {localStorage:storage(),sessionStorage:storage()};
let api = load(browser);
const answers = {sexe:'Femme',age:42,dureeSeanceMinutes:45,frequenceEntrainement:'2 fois par semaine'};
api.storeDiagnosticAnswers(answers,' test@example.test ');
api = load(browser); // Nouvelle page, même onglet.
assert.equal(JSON.stringify(api.readDiagnosticAnswers('TEST@example.test')),JSON.stringify(answers));
assert.equal(api.readDiagnosticSignupEmail(),'test@example.test');
assert.equal(api.readDiagnosticAnswers('test@example.test').email,undefined);
assert.equal(api.readDiagnosticAnswers('other@example.test'),null);
let mismatches=0;
assert.equal(api.readDiagnosticAnswers('other@example.test',()=>mismatches++),null);
assert.equal(mismatches,1);
assert.equal(api.readDiagnosticAnswers('test@example.test',()=>mismatches++).age,42);
assert.equal(mismatches,1,'The matching recipient needs no warning');
assert.equal(api.readDiagnosticAnswers(null),null);
assert.equal(JSON.stringify(api.readDiagnosticAnswers('test@example.test')),JSON.stringify(answers), 'Wrong account must not erase the original transfer');
assert.equal(load({localStorage:browser.localStorage,sessionStorage:storage()}).readDiagnosticSignupEmail(),null);
api.clearDiagnosticAnswers();
assert.equal(api.readDiagnosticAnswers(),null);
assert.equal(api.readDiagnosticSignupEmail(),null);
api.storeDiagnosticAnswers(answers,'invalid');
assert.equal(api.readDiagnosticSignupEmail(),null);
assert.equal(api.readDiagnosticAnswers('test@example.test'),null);
api.storeDiagnosticAnswers(answers,'test@example.test');
api.storeDiagnosticAnswers(answers);
assert.equal(api.readDiagnosticSignupEmail(),null,'A new draft without email must not prefill an old recipient');
api.storeDiagnosticAnswers(answers,'test@example.test');
const key = 'coai_diagnostic_pre_signup';
const envelope = JSON.parse(browser.localStorage.getItem(key));
assert.equal(envelope.version, 2);
assert(envelope.expiresAt > Date.now());
assert(envelope.expiresAt <= Date.now() + 86400000);
assert.equal(JSON.stringify(envelope.answers), JSON.stringify(answers));
for (const invalid of [answers, [], true, 'old', null,
  {...envelope, version: 1}, {...envelope, expiresAt: Date.now() - 1},
  {...envelope, expiresAt: 'tomorrow'}, {...envelope, answers: []},
  {...envelope, answers: null}]) {
  browser.localStorage.setItem(key, JSON.stringify(invalid));
  assert.equal(api.readDiagnosticAnswers('test@example.test'), null, 'Reject expired, legacy or malformed transfers');
  assert.equal(browser.localStorage.getItem(key), null, 'Remove invalid stored transfer');
}
browser.localStorage.setItem(key, '{broken');
assert.equal(api.readDiagnosticAnswers(), null);
assert.equal(browser.localStorage.getItem(key), null);
for(const isolated of [undefined,{localStorage:{setItem(){throw Error('blocked');},getItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}},sessionStorage:{setItem(){throw Error('blocked');},getItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}}}]) {
  const safe=load(isolated);
  assert.doesNotThrow(()=>safe.storeDiagnosticAnswers(answers,'test@example.test'));
  assert.equal(safe.readDiagnosticAnswers(),null);
  assert.equal(safe.readDiagnosticSignupEmail(),null);
  assert.doesNotThrow(()=>safe.clearDiagnosticAnswers());
}
console.log('PASS: réponses transmises, email séparé limité à l’onglet, nettoyage, SSR et stockage bloqué.');
