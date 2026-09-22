// Real submit handler; React state and API transport simulated. No paid call.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');
const source = ts.transpileModule(fs.readFileSync('src/components/coach/ask-coach.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}
async function scenario(body, status = 200, offline = false) {
  const values = []; let cursor = 0; let requests = 0;
  const exports = {};
  const dependencies = {
    'react/jsx-runtime': jsx,
    react: { useState: initial => {
      const index = cursor++;
      if (!(index in values)) values[index] = initial;
      return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value; }];
    } },
    'next/image': { default: 'img' }, 'next/link': { default: 'a' },
    '@/components/ui/button': { Button: 'button' },
  };
  vm.runInNewContext(source, {
    exports, require: name => { assert(name in dependencies, name); return dependencies[name]; },
    fetch: async (url, options) => {
      requests++; assert.equal(url, '/api/coach/ask');
      assert.equal(JSON.parse(options.body).question, 'Ma question');
      if (offline) throw Error('offline');
      return { ok: status === 200, status, json: async () => body };
    },
    setTimeout: () => { throw Error('Artificial response delay forbidden'); },
  });
  const render = () => { cursor = 0; return nodes(exports.AskCoach({ initialQuotaRemaining: 2 })); };
  render().find(n => n.type === 'textarea').props.onChange({ target: { value: 'Ma question' } });
  await render().find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(requests, 1);
  assert.equal(values[1], false, 'Loading ends');
  return values;
}
(async () => {
  const success = await scenario({ answer: 'Réponse utile', quotaRemaining: 1 });
  assert.equal(success[0], ''); assert.equal(success[4][0].reponse, 'Réponse utile'); assert.equal(success[5], 1);
  for (const body of [null, {}, { answer: '' }, { answer: '  ' }]) {
    const failure = await scenario(body);
    assert.equal(failure[0], 'Ma question'); assert.equal(failure[4].length, 0); assert.ok(failure[2]);
  }
  const quota = await scenario({ error: 'Quota atteint' }, 429);
  assert.equal(quota[3], true); assert.equal(quota[5], 0);
  const offline = await scenario(null, 200, true);
  assert.equal(offline[0], 'Ma question'); assert.ok(offline[2]);
  console.log('PASS: immediate reply, malformed/empty reply, quota, offline; API and hooks mocked, no paid request.');
})().catch(error => { console.error(error); process.exitCode = 1; });
