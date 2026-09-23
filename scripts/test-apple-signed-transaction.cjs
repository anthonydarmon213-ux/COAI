const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(path) {
  const out = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports: out, Buffer, require: name => name.startsWith('./') ? load('src/lib/subscription/' + name.slice(2) + '.ts') : require(name) });
  return out;
}
const { createAppleTransactionVerifier: create } = load('src/lib/subscription/apple-signed-transaction.ts');
// A non-Apple CA is sufficient ONLY to exercise rejection, never successful validation.
const config = { appleRootCertificates: [Buffer.from(require('node:tls').rootCertificates[0])], bundleId: 'test.coai', environment: 'Sandbox', productIDs: ['test.monthly'] };
(async () => {
  assert.throws(() => create({ ...config, appleRootCertificates: [] }));
  assert.throws(() => create({ ...config, productIDs: [] }));
  assert.throws(() => create({ ...config, environment: 'Production' }));
  assert.throws(() => create({ ...config, environment: 'Xcode' }));
  const verify = create(config);
  const verifyNotification = load('src/lib/subscription/apple-notification.ts').createAppleNotificationVerifier(config);
  for (const input of ['', 'x'.repeat(65537), 'not-a-jws', 'eyJhbGciOiJub25lIn0.e30.']) {
    await assert.rejects(() => verify(input, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
    await assert.rejects(() => verifyNotification(input));
  }
  console.log('PASS: official Apple verifier rejects invalid config/JWS; valid Apple transaction still untested.');
})().catch(error => { console.error(error); process.exitCode = 1; });
