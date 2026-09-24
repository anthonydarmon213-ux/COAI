// No network: exercise the real optional notifier against a hung fetch double.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/lib/whatsapp/client.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
async function check(configured, mode) {
  let calls = 0, signalRequested = false, receivedSignal;
  const errors = [];
  const controller = new AbortController();
  const box = { exports: {}, process: { env: configured ? { MAKE_OUTGOING_WEBHOOK_URL: 'https://example.invalid/mock' } : {} },
    console: { warn() {}, error(...args) { errors.push(args); } },
    AbortSignal: { timeout: ms => {
      assert.equal(ms, 5000); signalRequested = true;
      return controller.signal;
    } },
    fetch: async (_url, options) => {
      calls++;
      receivedSignal = options.signal;
      assert.equal(options.signal, controller.signal, 'External notifier requires a bounded wait');
      if (mode === 'network') throw new Error('secret webhook URL and private profile');
      if (mode === 'hung') return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('deadline')), { once: true });
        queueMicrotask(() => controller.abort());
      });
      return { ok: mode !== 'http-error', status: mode === 'http-error' ? 503 : 200 };
    },
  };
  vm.runInNewContext(code, box);
  await box.exports.notifyMakeScenario({ userId: 'synthetic', event: 'profile_updated', data: {} });
  assert.equal(calls, configured ? 1 : 0);
  assert.equal(signalRequested, configured);
  if (configured) assert.equal(receivedSignal, controller.signal);
  if (configured && mode === 'hung') assert.equal(controller.signal.aborted, true);
  assert.ok(!JSON.stringify(errors).includes('secret'));
  assert.ok(errors.every(args => args.length === 1 && typeof args[0] === 'string'), 'Never log raw errors or response bodies');
  assert.equal(errors.length, configured && mode !== 'success' ? 1 : 0);
}
(async () => {
  await check(false);
  for (const mode of ['success', 'network', 'hung', 'http-error']) await check(true, mode);
  console.log('PASS: optional notification bounded at 5s, no retries, failures non-blocking; network fully mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
