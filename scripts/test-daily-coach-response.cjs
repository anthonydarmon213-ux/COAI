// Real component submit handler. React, effects and API transport simulated.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/components/daily/daily-coach.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}
async function scenario(body, status = 200, draft, offline = false) {
  const values = []; let cursor = 0, requests = 0;
  const dependencies = {
    'react/jsx-runtime': require('react/jsx-runtime'),
    react: {
      useEffect() {}, useRef: () => ({ current: null }),
      useState(initial) { const index = cursor++; if (!(index in values)) values[index] = initial;
        return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value; }]; },
    },
    '@/components/ui/button': { Button: 'button' },
  };
  const box = { exports: {}, require: key => { assert(key in dependencies, key); return dependencies[key]; },
    fetch: async (url, options) => {
      requests++; assert.equal(url, '/api/coach/ask');
      assert.equal(JSON.parse(options.body).question, 'Ma question');
      assert.equal(JSON.parse(options.body).context.source, 'DAILY_WORKOUT');
      if (draft !== undefined) values[1] = draft;
      if (offline) throw Error('Hors ligne');
      return { ok: status === 200, status, json: async () => body };
    },
  };
  vm.runInNewContext(source, box);
  const render = () => { cursor = 0; return nodes(box.exports.DailyCoach({ context: { source: 'DAILY_WORKOUT' } })); };
  render().find(node => node.type === 'button').props.onClick();
  render().find(node => node.type === 'textarea').props.onChange({ target: { value: 'Ma question' } });
  await render().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(requests, 1); assert.equal(values[2], false);
  return values;
}
(async () => {
  const next = await scenario({ answer: 'Réponse utile' }, 200, 'Prochaine question');
  assert.equal(next[1], 'Prochaine question', 'A late reply must preserve a newer draft');
  assert.equal(next[5][0].answer, 'Réponse utile');
  const success = await scenario({ answer: 'Réponse utile' }); assert.equal(success[1], '');
  for (const body of [null, {}, { answer: '' }, { answer: '  ' }, { answer: 123 }]) {
    const result = await scenario(body);
    assert.equal(result[1], 'Ma question'); assert.equal(result[5].length, 0); assert.ok(result[3]);
  }
  const quota = await scenario({ error: 'Quota atteint' }, 429); assert.equal(quota[4], true);
  const offline = await scenario(null, 200, undefined, true); assert.equal(offline[1], 'Ma question'); assert.ok(offline[3]);
  console.log('PASS daily coach: valid response, newer draft retained, malformed/empty response rejected, quota and offline recoverable. No real AI call.');
})().catch(error => { console.error(error); process.exitCode = 1; });
