const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, modules = {}, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, Date, process: { env }, require: name => {
    assert(Object.hasOwn(modules, name), name); return modules[name];
  } });
  return exports;
}
async function main() {
  const policy = load('src/lib/subscription/effective-access.ts');
  const user = { id: 'authenticated-user', programmeUnlockedAt: null, subscription: null };
  for (const enabled of [undefined, 'false', 'true']) {
    for (const environment of [undefined, 'Sandbox', 'Production', 'invalid']) {
      for (const failure of [false, true]) {
        let calls = 0;
        const { contentAccessFor } = load('src/lib/subscription/content-access.ts', {
          '@/lib/db/client': { prisma: {} }, './effective-access': policy,
          './read-effective-access': { readEffectiveAccess: async (_db, id, env) => {
            calls++; assert.equal(id, user.id); assert.equal(env, environment);
            if (failure) throw Error('private-db-error');
            return { subscribed: true, programme: true, catalogue: true, suivi: true, plan: 'PASS_IA', sources: { apple: true, stripe: false } };
          } },
        }, { APPLE_CONTENT_ACCESS_ENABLED: enabled, APPLE_STORE_ENVIRONMENT: environment });
        const result = await contentAccessFor(user);
        const configured = enabled === 'true' && ['Sandbox', 'Production'].includes(environment);
        assert.equal(calls, configured ? 1 : 0);
        assert.equal(result.subscribed, configured && !failure);
        assert.equal(result.appleUnavailable, enabled === 'true' && (!configured || failure));
        const history = await contentAccessFor({ ...user, programmeUnlockedAt: new Date(1000) });
        assert.equal(history.programme, true);
        if (!configured || failure) assert.equal(history.catalogue, false);
        for (const plan of ['PASS_IA', 'STANDARD', 'PREMIUM']) {
          const before = calls;
          const stripe = await contentAccessFor({ ...user, subscription: { status: 'ACTIVE', plan } });
          assert.equal(stripe.plan, plan); assert.equal(stripe.subscribed, true);
          assert.equal(stripe.appleUnavailable, false); assert.equal(calls, before);
        }
      }
    }
  }
  console.log('PASS: 24 rollout/environment/failure combinations, historical rights and 3 Stripe plans preserved; no Apple query when disabled. Read dependency mocked.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
