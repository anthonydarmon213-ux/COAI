const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../src/app/api/profil/avatar/route.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function scenario(failure, file = new File(['image'], 'avatar.png', { type: 'image/png' })) {
  const calls = [], api = {};
  const modules = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/auth/server': { getCurrentAppUser: async () => failure === 'anonymous' ? null : { id: 'profile', supabaseAuthId: 'owner' } },
    '@/lib/db/client': { prisma: { user: { update: async ({ where, data }) => {
      assert.equal(where.id, 'profile'); assert.equal(data.avatarPath, 'owner/avatar.png');
      calls.push('persist'); if (failure === 'database') throw new Error('private database detail');
    } } } },
    '@/lib/storage/progress-photos': {
      uploadAvatar: async owner => {
        assert.equal(owner, 'owner'); calls.push('upload');
        if (failure === 'upload-throw') throw new Error('private storage detail');
        return failure === 'upload-error' ? { error: 'private storage detail' } : { path: 'owner/avatar.png' };
      },
      getSignedProgressPhotoUrl: async owner => {
        assert.equal(owner, 'owner'); calls.push('sign');
        if (failure === 'sign-throw') throw new Error('private signing detail');
        return failure === 'sign-empty' ? null : 'https://example.test/signed-avatar';
      },
    },
  };
  vm.runInNewContext(source, { exports: api, File, require: name => {
    assert(name in modules, name); return modules[name];
  } });
  const response = await api.POST({ formData: async () => {
    calls.push('parse');
    if (failure === 'multipart') throw new Error('invalid multipart');
    const form = new FormData(); if (file) form.set('file', file); return form;
  } });
  return { ...response, calls };
}
(async () => {
  assert.equal((await scenario('anonymous')).status, 401);
  assert.deepEqual((await scenario('anonymous')).calls, []);
  for (const [failure, file] of [
    ['multipart', undefined], [null, null], [null, new File([], 'empty.png', { type: 'image/png' })],
    [null, new File(['x'], 'script.html', { type: 'text/html' })],
    [null, new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })],
  ]) {
    const result = await scenario(failure, file); assert.equal(result.status, 400);
    assert.deepEqual(result.calls, ['parse']);
  }
  for (const failure of ['upload-error', 'upload-throw', 'database', 'sign-empty', 'sign-throw']) {
    const result = await scenario(failure);
    assert.equal(result.status, 503, failure); assert.match(result.body.error, /Réessaie/);
    assert(!JSON.stringify(result.body).includes('private')); assert.equal(result.body.url, undefined);
    if (failure.startsWith('upload')) assert.deepEqual(result.calls, ['parse', 'upload']);
  }
  const success = await scenario(); assert.equal(success.status, 201);
  assert.equal(success.body.url, 'https://example.test/signed-avatar');
  assert.deepEqual(success.calls, ['parse', 'upload', 'persist', 'sign']);
  console.log('PASS avatar route: malformed/empty/oversize/unsupported input, private error redaction, upload/DB/signing failures and retryable response; mocked services');
})().catch(error => { console.error(error); process.exitCode = 1; });
