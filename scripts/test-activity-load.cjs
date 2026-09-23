const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/components/dashboard/activite-quotidienne-card.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
}).outputText;
async function check(mode, unmount = false) {
  const states = [], effects = [], out = {};
  let resolve;
  const response = new Promise(r => { resolve = r; });
  vm.runInNewContext(code, {
    exports: out, fetch: () => response,
    sessionStorage: { getItem: () => { if (mode === 'storage') throw Error('denied'); return '1'; } },
    require: name => {
      if (name === 'react') return {
        useState: initial => { const i = states.length; states.push(initial); return [initial, value => { states[i] = value; }]; },
        useEffect: effect => effects.push(effect)
      };
      if (name.includes('request-deadline')) return { withRequestDeadline: operation => operation(undefined) };
      return {};
    }
  });
  out.ActiviteQuotidienneCard();
  const cleanup = effects[0]();
  if (unmount) cleanup();
  const data = { entreeAujourdhui: null, signaux: {}, recommandation: {} };
  resolve({ ok: mode !== 'http', json: async () => { if (mode === 'json') throw Error('invalid'); return data; } });
  await new Promise(r => setImmediate(r));
  assert.equal(states[0], !unmount);
  assert.equal(states[1], unmount || ['http', 'json'].includes(mode) ? null : data);
  assert.equal(states[2], !unmount && mode === 'ok');
}
(async () => {
  for (const mode of ['ok', 'storage', 'http', 'json']) await check(mode);
  await check('ok', true);
  console.log('PASS optional activity load: valid, storage denied, HTTP/JSON failures and unmounted response (mock network).');
})().catch(error => { console.error(error); process.exitCode = 1; });
