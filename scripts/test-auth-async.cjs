const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// Network, cookie storage and database are doubles: this is not an OAuth E2E test.
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => dependencies[name] ?? require(name), process, console, URL });
  return exports;
}
(async () => {
  let header = null;
  let options;
  let token;
  let user = { id: 'test-user' };
  let writes = [];
  let queries = 0;
  const server = load('src/lib/auth/server.ts', {
    '@supabase/ssr': { createServerClient: (_url, _key, config) => {
      options = config;
      return { auth: { getUser: async value => { token = value; return { data: { user }, error: null }; } } };
    } },
    'next/headers': {
      cookies: async () => ({ get: () => ({ value: 'cookie-test' }), set: value => writes.push(value) }),
      headers: async () => ({ get: () => header }),
    },
    '@/lib/db/client': { prisma: { user: { findUnique: async query => { queries++; return query.where; } } } },
  });
  await server.createSupabaseServerClient();
  assert.equal(options.cookies.get('session'), 'cookie-test');
  options.cookies.set('session', 'new', { httpOnly: true });
  options.cookies.remove('session', { httpOnly: true });
  assert.equal(writes[0].value, 'new');
  assert.equal(writes[1].value, '');
  assert.equal(writes[1].httpOnly, true);
  assert.equal((await server.getCurrentUser()).id, 'test-user');
  assert.equal(token, undefined);
  header = 'Bearer test-token';
  await server.getCurrentUser();
  assert.equal(token, 'test-token');
  assert.equal((await server.getCurrentAppUser()).supabaseAuthId, 'test-user');
  user = null;
  assert.equal(await server.getCurrentAppUser(), null);
  assert.equal(queries, 1);
  const callback = load('src/app/auth/callback/route.ts', {
    '@/lib/auth/server': { createSupabaseServerClient: async () => ({ auth: {
      exchangeCodeForSession: async code => ({ data: { user: code === 'valid' ? { id: 'test-user' } : null }, error: null }),
    } }) },
    '@/lib/db/client': { prisma: { user: { findUnique: async () => ({ id: 'app-user' }) } } },
    '@/lib/auth/safe-redirect': { sanitizeReturnTo: () => null },
    '@/lib/auth/confirmation': { authFailureDestination: origin => new URL('/sign-in', origin) },
  });
  for (const [code, destination] of [['valid', '/dashboard'], ['invalid', '/sign-in'], ['', '/sign-in']]) {
    const response = await callback.GET(new Request('https://coai.fr/auth/callback?code=' + code));
    assert.equal(new URL(response.headers.get('location')).pathname, destination);
  }
  console.log('PASS: async cookies/headers, bearer/cookie auth, app-user lookup and OAuth callback (mocked services).');
})().catch(error => { console.error(error); process.exitCode = 1; });
