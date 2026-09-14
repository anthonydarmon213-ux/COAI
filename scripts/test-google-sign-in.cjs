// Real component handlers; simulated OAuth, no account or network side effects.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
let states, cursor, calls, mode, args;
const box = { exports: {}, URL, window: { location: { origin: 'https://coai.fr' } },
  require: name => name === 'react' ? {
    useState: init => { const i = cursor++; if (!(i in states)) states[i] = init; return [states[i], v => { states[i] = v; }]; },
    useRef: init => { const i = cursor++; return states[i] ?? (states[i] = { current: init }); },
  } : name === '@/lib/auth/client' ? { createSupabaseBrowserClient: () => {
    if (mode === 'initialization') throw new Error('configuration');
    return { auth: { signInWithOAuth: async input => {
      calls++; args = input;
      if (mode === 'network') throw new TypeError('network');
      return { error: mode === 'returned-error' ? { message: 'provider failure' } : null };
    } } };
  } } : name.startsWith('@/') ? { Button: 'button' } : require(name),
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/auth/google-sign-in-button.tsx','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
function render() { cursor = 0; return box.exports.GoogleSignInButton({ redirectTo: '/programme/seance-du-jour?seance=1' }).props.children; }
(async () => {
  for (mode of ['returned-error', 'network', 'initialization']) {
    states = []; calls = 0;
    await render()[0].props.onClick();
    assert.equal(render()[0].props.disabled, false);
    assert.equal(render()[1].props.role, 'alert');
    mode = 'success'; calls = 0;
    const click = render()[0].props.onClick;
    const pending = click(); await click(); await pending;
    assert.equal(calls, 1, 'double click suppressed');
    assert.equal(render()[0].props.disabled, true, 'wait for successful redirect');
    assert.equal(render()[1], null, 'error cleared on retry');
    assert.equal(args.provider, 'google');
    assert.equal(new URL(args.options.redirectTo).searchParams.get('redirect_to'), '/programme/seance-du-jour?seance=1');
  }
  console.log('PASS: OAuth returned error, exception, initialization error, retry, double click, destination.');
})().catch(e => { console.error(e); process.exitCode = 1; });
