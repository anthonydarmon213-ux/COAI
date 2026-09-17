const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(file, deps = {}, globals = {}) {
  const box = { exports: {}, URL, ...globals, require: key => {
    assert.ok(key in deps, key); return deps[key];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, box);
  return box.exports;
}
const privacy = load('src/lib/analytics/error-privacy.ts');
const secret = 'DONNEE_SENSIBLE_FICTIVE';
const hint = { attachments: [{ filename: 'photo.png', data: secret }] };
const event = { event_id: 'a'.repeat(32), timestamp: 100, release: 'b'.repeat(40),
  message: secret, user: { email: secret }, request: { data: secret },
  contexts: { health: secret }, extra: { note: secret }, breadcrumbs: [{ message: secret }],
  tags: { client: secret }, fingerprint: [secret], transaction: secret, threads: { values: [secret] },
  exception: { values: [{ type: 'TypeError', value: secret, mechanism: { data: secret }, stacktrace: { frames: [
    { filename: 'https://coai.fr/_next/static/chunks/app.js?token=' + secret, lineno: 12, colno: 8, vars: { note: secret }, context_line: secret },
    { filename: 'https://evil.test/' + secret, lineno: 1 },
    { filename: '/api/compte/' + secret },
    { filename: '/var/task/server.js', vars: { note: secret } },
  ] } }] },
};
const result = privacy.privateErrorReport(event, hint);
assert.ok(!JSON.stringify(result).includes(secret));
assert.equal(hint.attachments.length, 0);
assert.equal(event.message, secret, 'original event is not mutated');
assert.equal(result.exception.values[0].type, 'TypeError');
assert.equal(result.exception.values[0].stacktrace.frames.length, 1);
assert.equal(result.exception.values[0].stacktrace.frames[0].filename, 'https://coai.fr/_next/static/chunks/app.js');
assert.equal(privacy.privateErrorReport({ exception: { values: [{ type: secret }] } }, {}).exception.values[0].type, 'Error');
assert.equal(privacy.privateErrorReport({ message: secret, exception: { values: [] } }, {}).exception.values.length, 1);
assert.equal(privacy.privateErrorOptions.beforeSendTransaction(event), null);
for (const file of ['sentry.client.config.ts', 'sentry.server.config.ts', 'sentry.edge.config.ts']) {
  const configs = [];
  const deps = { '@sentry/nextjs': { init: options => configs.push(options) }, './src/lib/analytics/error-privacy': privacy };
  load(file, deps, { process: { env: {} } });
  assert.equal(configs.length, 0, 'no DSN stays inactive');
  load(file, deps, { process: { env: { NEXT_PUBLIC_SENTRY_DSN: 'https://test.invalid' } } });
  assert.equal(configs.length, 1);
  assert.equal(configs[0].beforeSend, privacy.privateErrorReport);
  assert.equal(configs[0].tracesSampleRate, 0);
  assert.equal(configs[0].enableLogs, false);
  assert.equal(configs[0].dataCollection.cookies, false);
  assert.equal(configs[0].dataCollection.httpBodies.length, 0);
}
async function verifySDKEnvelope() {
  const Sentry = require('@sentry/node');
  const envelopes = [];
  Sentry.init({
    ...privacy.privateErrorOptions,
    dsn: 'https://public@example.invalid/1',
    defaultIntegrations: false,
    autoSessionTracking: false,
    sendClientReports: false,
    transport: () => ({
      send: envelope => { envelopes.push(envelope); return Promise.resolve({ statusCode: 200 }); },
      flush: () => Promise.resolve(true),
    }),
  });
  Sentry.captureEvent(event, { attachments: [{ filename: 'private.txt', data: secret }] });
  await Sentry.flush(2000);
  assert.equal(envelopes.length, 1, 'real SDK exercised with memory-only transport');
  assert.ok(!JSON.stringify(envelopes).includes(secret), 'no private data in final envelope');
  assert.ok(!JSON.stringify(envelopes).includes('private.txt'), 'no attachment transmitted');
  const items = envelopes[0][1];
  assert.equal(items.filter(item => item[0].type === 'event').length, 1);
  assert.equal(items.filter(item => item[0].type === 'attachment').length, 0);
  await Sentry.close(2000);
  console.log('PASS error privacy: allow-list, three runtimes and real SDK envelope with memory-only transport; no network');
}
verifySDKEnvelope().catch(error => { console.error(error); process.exitCode = 1; });
