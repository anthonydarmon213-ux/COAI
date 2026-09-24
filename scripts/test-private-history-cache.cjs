const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let signedIn = false, reads = 0;
const rows = [{id: 'private-fixture'}];
const dependencies = {
  'next/server': require('next/server'), zod: require('zod'), 'node:crypto': require('node:crypto'),
  '@/lib/auth/server': {getCurrentUser: async () => signedIn ? {id: 'auth-member'} : null},
  '@/lib/db/client': {prisma: {
    user: {findUnique: async query => {reads++; assert.equal(query.where.supabaseAuthId, 'auth-member'); return {id: 'member'};}},
    mesure: {findMany: async query => {reads++; assert.equal(query.where.user.supabaseAuthId, 'auth-member'); return rows;}},
  }},
  '@/lib/suivi/workout-history': {workoutHistory: async id => {reads++; assert.equal(id, 'member'); return rows;}},
  '@/lib/analytics/product-events': {}, '@/lib/suivi/mesure-validation': {}, '@/lib/storage/progress-photos': {},
};
(async () => {
  for (const name of ['seances', 'mesures']) {
    const output = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/app/api/${name}/route.ts`, 'utf8'), {
      compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
    }).outputText, {exports: output, require: key => {assert(key in dependencies, key); return dependencies[key];}});
    for (signedIn of [false, true]) {
      reads = 0;
      const response = await output.GET();
      assert.equal(response.status, signedIn ? 200 : 401);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.match(response.headers.get('vary'), /Cookie/);
      assert.match(response.headers.get('vary'), /Authorization/);
      if (signedIn) assert.deepEqual(await response.json(), rows);
      else assert.equal(reads, 0);
    }
  }
  console.log('PASS private histories: authenticated/anonymous headers, scoped reads, no anonymous DB access. Dependencies mocked.');
})().catch(error => {console.error(error); process.exitCode = 1;});
