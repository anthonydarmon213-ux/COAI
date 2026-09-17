const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,
  '../src/lib/storage/progress-photos.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function scenario({ count = 205, listError = false, removeError = false,
  noRemoval = false, invalid = false, owner = 'auth_test' } = {}) {
  let files = Array.from({ length: count }, (_, i) => ({ id: `id-${i}`, name: `${String(i).padStart(4, '0')}.jpg` }));
  if (invalid) files = [{ id: null, name: 'unexpected-folder' }];
  const calls = [], removed = [], api = {};
  const bucket = {
    list: async (prefix, options) => {
      assert.equal(prefix, 'auth_test');
      calls.push(['list', options.offset, options.limit]);
      return { data: listError ? null : files.slice(options.offset, options.offset + options.limit), error: listError ? new Error('offline') : null };
    },
    remove: async paths => {
      calls.push(['remove', paths.length]);
      for (const path of paths) assert.ok(path.startsWith('auth_test/') && !path.includes('..'));
      if (!removeError && !noRemoval) {
        removed.push(...paths);
        files = files.filter(file => !paths.includes(`auth_test/${file.name}`));
      }
      return { error: removeError ? new Error('offline') : null };
    },
  };
  vm.runInNewContext(source, { exports: api, require: name => {
    assert.equal(name, '@/lib/auth/admin');
    return { createSupabaseAdminClient: () => ({ storage: { from: name => {
      assert.equal(name, 'progress photos'); return bucket;
    } } }) };
  } });
  let error;
  try { await api.deleteAllProgressPhotos(owner); } catch (caught) { error = caught; }
  return { calls, removed, files, error };
}

(async () => {
  for (const count of [0, 1, 100, 205]) {
    const result = await scenario({ count });
    assert.equal(result.error, undefined);
    assert.equal(result.removed.length, count);
    assert.equal(result.files.length, 0);
    assert.equal(new Set(result.removed).size, count);
  }
  const large = await scenario();
  assert.deepEqual(large.calls.slice(0, 3), [['list', 0, 100], ['list', 100, 100], ['list', 200, 100]]);
  for (const options of [{ listError: true }, { invalid: true }, { owner: '' }, { owner: '../other' }]) {
    const result = await scenario(options);
    assert.ok(result.error);
    assert.equal(result.removed.length, 0);
  }
  assert.match((await scenario({ removeError: true })).error.message, /removal_failed/);
  assert.match((await scenario({ noRemoval: true })).error.message, /unconfirmed/);
  console.log('PASS photo cleanup: pagination, exact batches, empty folder, invalid scope, listing/removal failures, unconfirmed removal; mocked only');
})().catch(error => { console.error(error); process.exitCode = 1; });
