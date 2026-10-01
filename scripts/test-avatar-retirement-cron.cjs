const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const transpile = relative => ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const route = transpile('src/app/api/cron/photos-retirees/route.ts');
const guard = transpile('src/lib/cron/auth.ts');
async function scenario({ secret, enabled, authorization, failure, deferred = 0 }) {
  const env = { CRON_SECRET: secret, PHOTO_RETIREMENT_CRON_ENABLED: enabled };
  const auth = {}; vm.runInNewContext(guard, { exports: auth, process: { env } });
  let calls = 0;
  const modules = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    '@/lib/cron/auth': auth,
    '@/lib/storage/progress-photos': { purgeRetiredAvatarBatch: async () => {
      calls++; if (failure) throw Error('private provider detail');
      return { attempted: 3, removed: 3 - deferred, deferred };
    } },
  };
  const exports = {};
  vm.runInNewContext(route, { exports, process: { env }, require: name => { assert(name in modules); return modules[name]; } });
  const result = await exports.GET(new Request('http://localhost/api/cron/photos-retirees', {
    headers: authorization ? { Authorization: authorization } : {},
  }));
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert(!JSON.stringify(result).includes('private'));
  return { ...result, calls };
}
(async () => {
  for (const params of [{}, { authorization: 'Bearer undefined' }, { secret: 'test', authorization: 'Bearer wrong' }]) {
    const result = await scenario(params); assert.equal(result.status, 401); assert.equal(result.calls, 0);
  }
  const valid = { secret: 'test', authorization: 'Bearer test' };
  const disabled = await scenario(valid); assert.equal(disabled.status, 503); assert.equal(disabled.calls, 0);
  const enabled = { ...valid, enabled: 'true' };
  const success = await scenario(enabled); assert.equal(success.status, 200); assert.equal(success.calls, 1);
  const partial = await scenario({ ...enabled, deferred: 1 }); assert.equal(partial.status, 503); assert.equal(partial.body.deferred, 1);
  const failure = await scenario({ ...enabled, failure: true }); assert.equal(failure.status, 503);
  console.log('PASS retirement cron: actual secret guard, disabled by default, bounded service called only after authorization, failures not reported as success, no private details or caching');
})().catch(error => { console.error(error); process.exitCode = 1; });
