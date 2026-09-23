const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const end = 2000000000000;
let now = end - 90061000, hooks, timer, cleared;
const listeners = new Map();
const target = prefix => ({
  addEventListener: (name, fn) => listeners.set(prefix + name, fn),
  removeEventListener: (name, fn) => { assert.equal(listeners.get(prefix + name), fn); listeners.delete(prefix + name); }
});
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/marketing/compte-a-rebours-rentree.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
}).outputText, {
  exports: exportsObject, Date: { now: () => now },
  window: { ...target('w'), setInterval: (fn, ms) => { assert.equal(ms, 1000); timer = fn; return 7; }, clearInterval: id => { cleared = id; } },
  document: target('d'),
  require: name => {
    if (name === 'react') return { useSyncExternalStore: (...args) => { hooks = args; return args[2](); } };
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name.includes('offre-rentree')) return { OFFRE_RENTREE_FIN: new Date(end), PRIX_APRES_OFFRE: 'test' };
    throw new Error(name);
  }
});
exportsObject.CompteAReboursRentree({});
const [subscribe, read, server] = hooks;
assert.equal(server(), null);
assert.equal(read(), 90061);
assert.equal(read(), read());
let refreshes = 0;
const cleanup = subscribe(() => refreshes++);
timer();
now = end - 1000;
listeners.get('wpageshow')();
assert.equal(read(), 1);
now = end + 1000;
listeners.get('dvisibilitychange')();
assert.equal(read(), 0);
assert.equal(refreshes, 3);
cleanup();
assert.equal(cleared, 7);
assert.equal(listeners.size, 0);
console.log('PASS offer clock: stable seconds, server placeholder, background resume, expiration and cleanup (simulated clock/events).');
