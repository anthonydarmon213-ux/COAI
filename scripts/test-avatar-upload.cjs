const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../src/lib/storage/progress-photos.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function scenario(type, failure) {
  const files = new Map([['owner/avatar.jpg', 'old'], ['other/avatar.jpg', 'other']]);
  const calls = [], api = {};
  const bucket = {
    list: async () => ({ data: [{ name: 'avatar.jpg' }], error: null }),
    remove: async paths => { calls.push('remove'); paths.forEach(p => files.delete(p)); return { error: null }; },
    upload: async (name, body, options) => {
      calls.push('upload');
      assert.equal(options.contentType, type);
      assert.equal(options.upsert, true);
      if (failure === 'throw') throw new Error('offline');
      if (failure) return { error: { message: 'offline' } };
      files.set(name, 'new'); return { error: null };
    },
  };
  vm.runInNewContext(source, { exports: api, require: name => {
    if (name === './photo-write-registry') return {
      reservePhotoWrite: async () => 'test-operation', confirmPhotoWrite: async () => {},
    };
    assert.equal(name, '@/lib/auth/admin');
    return { createSupabaseAdminClient: () => ({ storage: { from: name => {
      assert.equal(name, 'progress photos'); return bucket;
    } } }) };
  } });
  let result;
  try { result = await api.uploadAvatar('owner', { type, arrayBuffer: async () => new ArrayBuffer(1) }); }
  catch (e) { result = { error: e.message }; }
  assert.equal(files.get('other/avatar.jpg'), 'other');
  assert.ok(!calls.includes('remove'), 'Never remove the previous avatar before upload/profile persistence');
  if (failure) {
    assert.equal(files.get('owner/avatar.jpg'), 'old');
    assert.equal(result.error, 'offline');
  } else {
    assert.equal(files.get(result.path), 'new');
    if (type !== 'image/jpeg') assert.equal(files.get('owner/avatar.jpg'), 'old');
  }
}
(async () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    for (const failure of [false, true, 'throw']) await scenario(type, failure);
  }
  console.log('PASS avatar preservation: 3 formats, upload rejection/exception, other owner unchanged; Storage simulated');
})().catch(e => { console.error(e.message); process.exitCode = 1; });
