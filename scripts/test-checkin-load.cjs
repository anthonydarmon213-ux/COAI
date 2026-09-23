const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/dashboard/weekly-checkin-card.tsx', 'utf8');
const ast = ts.createSourceFile('card.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect;
function visit(n) {
  if (ts.isCallExpression(n) && n.expression.getText(ast) === 'useEffect' && n.arguments[0].getText(ast).includes('/api/check-in-hebdo')) effect = n.arguments[0].getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast); assert.ok(effect);
const code = ts.transpileModule(`const run = ${effect}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
(async () => {
  for (const mode of ['due', 'done', 'http', 'network', 'json', 'invalid', 'unmounted']) {
    const states = []; let resolve;
    const pending = new Promise(r => resolve = r);
    const box = { setDu: v => states.push(['due', v]), setLoadError: v => states.push(['error', v]), setLoaded: v => states.push(['loaded', v]),
      fetch: async () => { await pending; if (mode === 'network') throw Error('offline'); return { ok: mode !== 'http', json: async () => { if (mode === 'json') throw Error('bad json'); return mode === 'invalid' ? {} : { du: mode !== 'done' }; } }; } };
    vm.runInNewContext(code + '\nthis.cleanup = run();', box);
    if (mode === 'unmounted') box.cleanup();
    resolve(); await new Promise(r => setImmediate(r));
    if (mode === 'unmounted') assert.deepEqual(states, []);
    else if (['due', 'done'].includes(mode)) assert.deepEqual(states, [['due', mode === 'due'], ['error', false], ['loaded', true]]);
    else assert.deepEqual(states, [['error', true], ['loaded', true]]);
  }
  console.log('PASS: due/completed, HTTP/network/JSON errors and unmount cancellation; extracted real effect, mocked transport.');
})().catch(e => { console.error(e); process.exitCode = 1; });
