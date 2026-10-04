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
      assert.equal(options.upsert, false);
      assert.notEqual(name, 'owner/avatar.jpg');
      if (failure === 'throw') throw new Error('offline');
      if (failure) return { error: { message: 'offline' } };
      files.set(name, 'new'); return { error: null };
    },
  };
  vm.runInNewContext(source, { exports: api, require: name => {
    if (name === './photo-write-registry') return {
      reservePhotoWrite: async () => 'test-operation', beginPhotoWrite: async () => {}, confirmPhotoWrite: async () => {},
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
    assert.equal(files.get('owner/avatar.jpg'), 'old');
  }
}
(async () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    for (const failure of [false, true, 'throw']) await scenario(type, failure);
  }
  for (const proof of ['match', 'old-operation', 'wrong-path', 'wrong-bucket', 'missing-metadata', 'info-error', 'info-throws']) {
    let confirmed = 0;
    const api = {};
    const bucket = {
      upload: async (_path, _body, options) => {
        assert.equal(options.metadata.coaiUploadOperation, 'current-operation');
        return { error: { message: 'lost-response' } };
      },
      info: async requested => {
        assert.equal(requested, 'owner/current-operation.png');
        if (proof === 'info-throws') throw Error('offline');
        if (proof === 'info-error') return { data: null, error: Error('offline') };
        return { error: null, data: {
          name: proof === 'wrong-path' ? 'other/avatar.png' : requested,
          bucketId: proof === 'wrong-bucket' ? 'other bucket' : 'progress photos',
          metadata: proof === 'missing-metadata' ? undefined : {
            coaiUploadOperation: proof === 'old-operation' ? 'previous-operation' : 'current-operation',
          },
        } };
      },
    };
    vm.runInNewContext(source, { exports: api, require: name => {
      if (name === './photo-write-registry') return {
        reservePhotoWrite: async () => 'current-operation', beginPhotoWrite: async () => {}, confirmPhotoWrite: async () => { confirmed++; },
      };
      assert.equal(name, '@/lib/auth/admin');
      return { createSupabaseAdminClient: () => ({ storage: { from: () => bucket } }) };
    } });
    const result = await api.uploadAvatar('owner', { type: 'image/png', arrayBuffer: async () => new ArrayBuffer(1) });
    assert.equal(confirmed, proof === 'match' ? 1 : 0);
    assert.equal('path' in result, proof === 'match');
  }
  console.log('PASS avatar preservation: 3 formats, upload rejection/exception, other owner unchanged; Storage simulated');
  console.log('PASS lost response evidence: only matching operation + path + bucket confirms; stale/missing proof and info failures stay unresolved');
})().catch(e => { console.error(e.message); process.exitCode = 1; });
