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
  const exports = {}, calls = { auth: 0, user: 0, token: 0, access: 0 };
  const modules = {
    'next/server': { NextResponse },
    '@/lib/auth/server': { getCurrentUser: async () => {
      calls.auth++; if (options.failure === 'auth') throw Error(marker);
      return options.anonymous ? null : { id: 'verified-auth-id' };
    } },
    '@/lib/db/client': { prisma: { user: { findUnique: async query => {
      calls.user++; assert.equal(query.where.supabaseAuthId, 'verified-auth-id');
      if (options.failure === 'lookup') throw Error(marker);
      return options.missingProfile ? null : {
        id: 'verified-app-id', subscription: options.subscriptionStatus ? { status: options.subscriptionStatus } : null,
      };
    } } } },
    '@/lib/subscription/apple-account': { getOrCreateAppleAccountToken: async userID => {
      calls.token++; assert.equal(userID, 'verified-app-id');
      if (options.failure === 'token') throw Error(marker);
      return 'server-generated-token';
    } },
    '@/lib/subscription/apple-server-config': { applePurchasesAvailable: () => options.purchaseAvailable === true },
    '@/lib/subscription/read-effective-access': { readEffectiveAccess: async (_db, userID, environment) => {
      calls.access++; assert.equal(userID, 'verified-app-id'); assert.equal(environment, 'Sandbox');
      if (options.failure === 'access') throw Error(marker);
      return { subscribed: options.appleSubscribed === true, sources: { apple: options.appleSubscribed === true } };
    } },
  };
  const appURL = Object.hasOwn(options, 'appURL') ? options.appURL : 'https://coai.example';
  vm.runInNewContext(code, { exports, URL, process: { env: {
    NEXT_PUBLIC_APP_URL: appURL,
    APPLE_STORE_ENVIRONMENT: options.invalidAppleEnvironment ? 'unknown' :
      options.purchaseAvailable || options.contentAccessEnabled ? 'Sandbox' : undefined,
    APPLE_CONTENT_ACCESS_ENABLED: options.purchaseAvailable || options.contentAccessEnabled ? 'true' : undefined,
  } },
    require: name => { assert(Object.hasOwn(modules, name), name); return modules[name]; },
  });
  return { POST: exports.POST, calls };
}
async function scenario(options, expectedStatus, expectedTokenCalls = 0, extraHeaders = {}) {
  const { POST, calls } = load(options);
  const response = await POST(new Request('http://internal-proxy:3000/api/ios/apple/account?userId=attacker', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8',
      ...(!options.cookieSession && !options.anonymous ? { Authorization: 'Bearer verified-session' } : {}),
      ...extraHeaders },
    body: JSON.stringify({ userId: 'attacker', appAccountToken: 'attacker', plan: 'PREMIUM' }),
  }));
  assert.equal(response.status, expectedStatus, JSON.stringify(options));
  assert.equal(calls.token, expectedTokenCalls);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.match(response.headers.get('vary'), /Cookie, Authorization/);
  const text = await response.text();
  assert(!text.includes(marker)); assert(!text.includes('attacker'));
  if (expectedStatus !== 200) assert(!text.includes('appAccountToken'));
  else {
    const body = JSON.parse(text);
    const appleRead = options.purchaseAvailable === true || options.contentAccessEnabled === true;
    const existing = ['ACTIVE', 'PAST_DUE'].includes(options.subscriptionStatus) ||
      (appleRead && options.appleSubscribed === true);
    assert.equal(body.existingSubscription, existing);
    assert.equal(body.purchaseAllowed, options.purchaseAvailable === true && !existing);
    assert.equal(body.stripeSubscriptionStatus,
      ['ACTIVE', 'PAST_DUE'].includes(options.subscriptionStatus) ? options.subscriptionStatus : null);
    assert.equal(body.appleSubscription, appleRead ? options.appleSubscribed === true : null);
    assert.equal(calls.access, appleRead ? 1 : 0);
  }
  return calls;
}
async function main() {
  for (const appURL of [undefined, '', 'not-a-url', 'ftp://coai.example', 'mailto:support@coai.example', 'http://coai.example']) {
    const calls = await scenario({ appURL }, 503);
    assert.equal(calls.auth, 0); assert.equal(calls.user, 0);
  }
  await scenario({ anonymous: true }, 401);
  const malformed = await scenario({}, 401, 0, { Authorization: 'Basic invalid', Cookie: 'existing-session' });
  assert.equal(malformed.auth, 0, 'An explicit invalid authorization cannot fall back to cookies');
  await scenario({}, 401, 0, { Authorization: 'Bearer ' });
  await scenario({ cookieSession: true }, 403);
  await scenario({ cookieSession: true }, 200, 1, { Origin: 'https://coai.example' });
  await scenario({ missingProfile: true }, 404);
  for (const failure of ['auth', 'lookup', 'token']) await scenario({ failure }, 503, failure === 'token' ? 1 : 0);
  await scenario({}, 200, 1, { Origin: 'https://coai.example' });
  await scenario({ appURL: 'http://localhost:3050' }, 200, 1, { Origin: 'http://localhost:3050' });
  await scenario({ purchaseAvailable: true }, 200, 1);
  await scenario({ purchaseAvailable: true, subscriptionStatus: 'ACTIVE' }, 200, 1);
  await scenario({ purchaseAvailable: true, subscriptionStatus: 'PAST_DUE' }, 200, 1);
  await scenario({ purchaseAvailable: true, appleSubscribed: true }, 200, 1);
  await scenario({ contentAccessEnabled: true, appleSubscribed: true }, 200, 1);
  await scenario({ contentAccessEnabled: true, invalidAppleEnvironment: true }, 503);
  await scenario({ purchaseAvailable: true, failure: 'access' }, 503, 1);
  await scenario({}, 403, 0, { Origin: 'https://coai.example.attacker.test', 'X-Forwarded-Host': 'coai.example.attacker.test' });
  await scenario({}, 403, 0, { Origin: 'null' });
  await scenario({}, 415, 0, { 'Content-Type': '' });
  console.log('PASS: real-route fault/config/origin cases; malformed authorization and originless cookies denied before token creation. Dependencies mocked, not a production test.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
