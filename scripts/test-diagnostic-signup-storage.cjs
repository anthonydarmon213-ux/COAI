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
assert.equal(JSON.stringify(api.readDiagnosticAnswers()),JSON.stringify(answers));
assert.equal(api.readDiagnosticSignupEmail(),'test@example.test');
assert.equal(api.readDiagnosticAnswers().email,undefined);
assert.equal(load({localStorage:browser.localStorage,sessionStorage:storage()}).readDiagnosticSignupEmail(),null);
api.clearDiagnosticAnswers();
assert.equal(api.readDiagnosticAnswers(),null);
assert.equal(api.readDiagnosticSignupEmail(),null);
api.storeDiagnosticAnswers(answers,'invalid');
assert.equal(api.readDiagnosticSignupEmail(),null);
for(const isolated of [undefined,{localStorage:{setItem(){throw Error('blocked');},getItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}},sessionStorage:{setItem(){throw Error('blocked');},getItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}}}]) {
  const safe=load(isolated);
  assert.doesNotThrow(()=>safe.storeDiagnosticAnswers(answers,'test@example.test'));
  assert.equal(safe.readDiagnosticAnswers(),null);
  assert.equal(safe.readDiagnosticSignupEmail(),null);
  assert.doesNotThrow(()=>safe.clearDiagnosticAnswers());
}
console.log('PASS: réponses transmises, email séparé limité à l’onglet, nettoyage, SSR et stockage bloqué.');
