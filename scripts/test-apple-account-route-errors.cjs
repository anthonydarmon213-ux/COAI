// Fault injection into the real route module. Complements, does not replace,
// the HTTP/Auth/Postgres integration test. Never contacts external services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
const code = ts.transpileModule(fs.readFileSync('src/app/api/ios/apple/account/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const marker = 'PRIVATE_TEST_DETAIL_DO_NOT_EXPOSE';
function load(options = {}) {
  const exports = {}, calls = { auth: 0, user: 0, token: 0 };
  const modules = {
    'next/server': { NextResponse },
    '@/lib/auth/server': { getCurrentUser: async () => {
      calls.auth++; if (options.failure === 'auth') throw Error(marker);
      return options.anonymous ? null : { id: 'verified-auth-id' };
    } },
    '@/lib/db/client': { prisma: { user: { findUnique: async query => {
      calls.user++; assert.equal(query.where.supabaseAuthId, 'verified-auth-id');
      if (options.failure === 'lookup') throw Error(marker);
      return options.missingProfile ? null : { id: 'verified-app-id' };
    } } } },
    '@/lib/subscription/apple-account': { getOrCreateAppleAccountToken: async userID => {
      calls.token++; assert.equal(userID, 'verified-app-id');
      if (options.failure === 'token') throw Error(marker);
      return 'server-generated-token';
    } },
  };
  const appURL = Object.hasOwn(options, 'appURL') ? options.appURL : 'https://coai.example';
  vm.runInNewContext(code, { exports, URL, process: { env: { NEXT_PUBLIC_APP_URL: appURL } },
    require: name => { assert(Object.hasOwn(modules, name), name); return modules[name]; },
  });
  return { POST: exports.POST, calls };
}
async function scenario(options, expectedStatus, expectedTokenCalls = 0, extraHeaders = {}) {
  const { POST, calls } = load(options);
  const response = await POST(new Request('http://internal-proxy:3000/api/ios/apple/account?userId=attacker', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
    body: JSON.stringify({ userId: 'attacker', appAccountToken: 'attacker', plan: 'PREMIUM' }),
  }));
  assert.equal(response.status, expectedStatus, JSON.stringify(options));
  assert.equal(calls.token, expectedTokenCalls);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.match(response.headers.get('vary'), /Cookie, Authorization/);
  const text = await response.text();
  assert(!text.includes(marker)); assert(!text.includes('attacker'));
  if (expectedStatus !== 200) assert(!text.includes('appAccountToken'));
  return calls;
}
async function main() {
  for (const appURL of [undefined, '', 'not-a-url', 'ftp://coai.example', 'mailto:support@coai.example', 'http://coai.example']) {
    const calls = await scenario({ appURL }, 503);
    assert.equal(calls.auth, 0); assert.equal(calls.user, 0);
  }
  await scenario({ anonymous: true }, 401);
  await scenario({ missingProfile: true }, 404);
  for (const failure of ['auth', 'lookup', 'token']) await scenario({ failure }, 503, failure === 'token' ? 1 : 0);
  await scenario({}, 200, 1, { Origin: 'https://coai.example' });
  await scenario({ appURL: 'http://localhost:3050' }, 200, 1, { Origin: 'http://localhost:3050' });
  await scenario({}, 403, 0, { Origin: 'https://coai.example.attacker.test', 'X-Forwarded-Host': 'coai.example.attacker.test' });
  await scenario({}, 403, 0, { Origin: 'null' });
  await scenario({}, 415, 0, { 'Content-Type': '' });
  console.log('PASS: 16 real-route fault/config/origin cases; no private error disclosure or unauthorized token creation. Dependencies mocked, not a production test.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
