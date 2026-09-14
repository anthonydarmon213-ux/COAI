const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

let calls = 0;
let user = null;
let refresh = false;
const jar = () => {
  const values = new Map();
  return {
    getAll: () => [...values.values()],
    set: (name, value, options) => {
      const cookie = typeof name === 'object' ? name : { name, value, ...options };
      values.set(cookie.name, cookie);
    },
  };
};
const sandbox = {
  exports: {}, URL, process: { env: {} },
  require: id => {
    if (id === '@supabase/ssr') return { createServerClient: (_url, _key, options) => {
      calls++;
      return { auth: { getUser: async () => {
        if (refresh) options.cookies.setAll([{ name: 'test-session', value: 'refreshed', options: { httpOnly: true } }]);
        return { data: { user }, error: null };
      } } };
    } };
    if (id === 'next/server') return { NextResponse: {
      next: () => ({ kind: 'next', cookies: jar() }),
      redirect: url => ({ kind: 'redirect', url, cookies: jar() }),
    } };
    throw new Error(`Unexpected dependency ${id}`);
  },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/middleware.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, sandbox);

async function invoke(path, method = 'GET') {
  calls = 0;
  const url = new URL(path, 'https://coai.fr');
  const request = { method, url: url.href, nextUrl: url, cookies: jar() };
  return { result: await sandbox.exports.middleware(request), request };
}

(async () => {
  const media = execFileSync('git', ['ls-files', 'public/videos'], { encoding: 'utf8' }).trim().split('\n');
  assert.ok(media.length > 0);
  for (const file of media) {
    for (const method of ['GET', 'HEAD']) {
      const { result } = await invoke(file.replace(/^public/, '') + '?v=test', method);
      assert.equal(calls, 0, `${method} ${file} must not create an Auth client`);
      assert.equal(result.kind, 'next');
    }
  }
  for (const path of ['/videos', '/videos/exclusif', '/videos/private.mp4', '/admin/clients/client.jpg', '/compte/profil', '/programme/seance-du-jour?seance=0', '/dashboard', '/completer-inscription']) {
    const { result } = await invoke(path);
    assert.equal(calls, 1, path);
    assert.equal(result.kind, 'redirect', path);
    assert.equal(result.url.pathname, '/sign-in');
    assert.equal(result.url.searchParams.get('redirect_to'), path);
  }
  await invoke('/videos/exercices/crunch.mp4', 'POST');
  assert.equal(calls, 1, 'POST is not a public media read');
  user = { id: 'test' }; refresh = true;
  const { result, request } = await invoke('/programme/seance-du-jour?seance=0');
  assert.equal(calls, 1);
  assert.equal(result.kind, 'next');
  assert.equal(request.cookies.getAll()[0].value, 'refreshed');
  assert.equal(result.cookies.getAll()[0].value, 'refreshed');
  user = null;
  const denied = await invoke('/compte/profil');
  assert.equal(denied.result.kind, 'redirect');
  assert.equal(denied.result.cookies.getAll()[0].value, 'refreshed');
  console.log(`OK: ${media.length} public media GET/HEAD, protected routes, query return and refreshed cookies`);
})().catch(error => { console.error(error); process.exitCode = 1; });
