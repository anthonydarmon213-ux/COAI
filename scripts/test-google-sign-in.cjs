// Real component handlers; simulated OAuth, no account or network side effects.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
let states, cursor, calls, mode, args;
const box = { exports: {}, URL, process: { env: {} }, window: { location: { origin: 'https://coai.fr' } },
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
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/auth/social-sign-in-buttons.tsx','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
function render() { cursor = 0; return box.exports.SocialSignInButtons({ redirectTo: '/programme/seance-du-jour?seance=1' }).props.children.filter(Boolean); }
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
    assert.equal(render()[1], undefined, 'error cleared on retry');
    assert.equal(args.provider, 'google');
    assert.equal(new URL(args.options.redirectTo).searchParams.get('redirect_to'), '/programme/seance-du-jour?seance=1');
  }
  box.process.env.NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED = 'true';
  states = []; calls = 0; mode = 'success';
  const buttons = render();
  assert.equal(buttons.length, 2);
  const pending = buttons[0].props.onClick();
  await buttons[1].props.onClick(); await pending;
  assert.equal(calls, 1, 'Apple and Google share a single-flight lock');
  assert.equal(args.provider, 'apple');
  assert(render().every(button => button.props.disabled));
  states = []; mode = 'network';
  await render()[0].props.onClick();
  assert.match(render()[2].props.children, /Apple/);
  assert.equal(render()[1].props.disabled, false);
  for (const value of [undefined, 'false', 'TRUE', '1']) {
    box.process.env.NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED = value; states = [];
    assert.equal(render().length, 1, 'Apple remains hidden unless explicitly enabled');
  }
  console.log('PASS: Google/Apple OAuth errors, retry, shared double-click lock, destination and Apple default-off display. No real authentication performed.');
})().catch(e => { console.error(e); process.exitCode = 1; });
