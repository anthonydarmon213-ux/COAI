// Actual handlers, simulated transport/timers. No Stripe call or navigation.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
let states, cursor, timer, cleared, calls, mode;
const location = { href: '' };
const box = { exports: {}, AbortController, TypeError, window: { location },
  setTimeout: fn => { timer = fn; return 1; }, clearTimeout: () => { cleared++; },
  fetch: async (_, {signal}) => {
    calls++;
    if (mode === 'timeout') return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
    if (mode === 'network') throw new TypeError('fetch failed');
    return { ok: mode === 'success', status: mode === 'auth' ? 401 : 500,
      json: async () => { if (mode === 'html') throw new SyntaxError('not json'); return { url: mode === 'success' ? 'https://billing.stripe.com/test' : undefined }; } };
  },
  require: name => name === 'react' ? {
    useState: init => { const i = cursor++; if (!(i in states)) states[i] = init; return [states[i], v => { states[i] = v; }]; },
    useRef: init => { const i = cursor++; return states[i] ?? (states[i] = { current: init }); },
  } : name.startsWith('@/') ? { Button: 'button' } : require(name),
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/compte/portal-button.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
function render() { cursor = 0; return box.exports.PortalButton({}).props.children; }
(async () => {
  for (mode of ['timeout', 'network', 'html', 'auth', 'success']) {
    states = []; calls = cleared = 0; location.href = '';
    const click = render()[0].props.onClick;
    const pending = click(); await click(); assert.equal(calls, 1, 'double click suppressed');
    if (mode === 'timeout') timer();
    await pending;
    assert.equal(cleared, 1);
    if (mode === 'success') assert.equal(location.href, 'https://billing.stripe.com/test');
    else {
      assert.equal(render()[0].props.disabled, false);
      assert.equal(render()[1].props.role, 'alert');
      assert.equal(location.href, '');
      mode = 'success'; await render()[0].props.onClick();
      assert.equal(calls, 2, 'retry allowed');
    }
  }
  console.log('PASS: timeout, network, invalid JSON, expired auth, successful redirect, double click and retry (simulated)');
})().catch(e => { console.error(e); process.exitCode = 1; });
