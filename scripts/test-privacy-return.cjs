const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/analytics/privacy-controls.tsx', 'utf8');
const ast = ts.createSourceFile('privacy.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect') callback = node.arguments[0];
  ts.forEachChild(node, visit);
}
visit(ast); assert.ok(callback);
const compiled = ts.transpileModule(`(${callback.getText(ast)})`, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
for (const signal of ['pageshow', 'visibilitychange', 'focus', 'storage', 'interval']) {
  const window = new EventTarget(), document = new EventTarget();
  document.visibilityState = 'visible';
  let consent = {audience: true, marketing: true};
  let reloads = 0, clears = 0, captures = 0, updates = 0, interval, canceled = false;
  window.location = {reload: () => reloads++};
  window.setInterval = fn => {interval = fn; return 123;};
  window.clearInterval = id => {assert.equal(id, 123); canceled = true;};
  const box = {window, document, CONSENT_EVENT: 'privacy', CONSENT_KEY: 'consent',
    REFUSE_ALL: {audience:false, marketing:false}, isNativeIOSApp: () => false,
    setNativeIOS: () => {}, readConsent: () => consent,
    active: {current:null}, initialized: {current:false},
    clearUtmCookie: () => clears++, captureUtmFromLocation: () => captures++,
    setChoices: () => updates++, setDraft: () => {}, setOpen: () => {}};
  const cleanup = vm.runInNewContext(compiled, box)();
  assert.equal(captures, 1); assert.equal(updates, 1); assert.equal(reloads, 0);
  consent = null; // Expiry, revoked choice, or deleted storage: fail closed.
  document.visibilityState = 'hidden';
  document.dispatchEvent(new Event('visibilitychange')); assert.equal(reloads, 0);
  document.visibilityState = 'visible';
  const trigger = () => {
    if (signal === 'interval') interval();
    else if (signal === 'visibilitychange') document.dispatchEvent(new Event(signal));
    else {
      const event = new Event(signal);
      if (signal === 'storage') Object.defineProperty(event, 'key', {value:'consent'});
      window.dispatchEvent(event);
    }
  };
  trigger(); assert.equal(reloads, 1, signal); assert.equal(clears, 1, signal);
  assert.equal(captures, 1, 'No renewed attribution without consent');
  cleanup(); assert.equal(canceled, true);
  if (signal !== 'interval') {trigger(); assert.equal(reloads, 1, 'Listeners removed');}
}
console.log('PASS privacy lifecycle: restored page, foreground, focus, storage and interval revoke active tracking via reload; hidden events ignored; subscriptions cleaned. Event/clock simulation, not Safari E2E.');
