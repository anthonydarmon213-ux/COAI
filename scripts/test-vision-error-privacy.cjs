const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const consentBox = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/ai/image-consent.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, consentBox);
const consent = consentBox.exports;
const scopes = { 'profil/photo-morphologie': 'morphologie', 'profil/montre': 'montre',
  'programme/motion-check': 'mouvement', 'nutrition/photo-repas': 'repas', 'nutrition/menu-restaurant': 'menu' };
const cases = [
  ['profil/photo-morphologie', 'body-photo-extraction', 'buildBodyPhotoExtractionPrompt'],
  ['profil/montre', 'watch-screenshot-extraction', 'buildWatchScreenshotExtractionPrompt'],
  ['programme/motion-check', 'motion-check-extraction', 'buildMotionCheckPrompt'],
  ['nutrition/photo-repas', 'meal-photo-extraction', 'buildMealPhotoExtractionPrompt'],
  ['nutrition/menu-restaurant', 'menu-restaurant-extraction', 'buildMenuRestaurantPrompt'],
];
async function exercise([route, promptModule, promptFunction], mode) {
  const logs = [];
  let aiCalls = 0, writes = 0;
  const providerError = new Error('PRIVATE-photo-base64-health-notes');
  providerError.request = { headers: { authorization: 'PRIVATE-provider-key' }, body: 'PRIVATE-image' };
  const dependencies = {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    zod: require('zod'),
    '@/lib/ai/image-consent': consent,
    '@/lib/auth/server': { getCurrentUser: async () => mode === 'unauthenticated' ? null : { id: 'fixture-auth' } },
    '@/lib/subscription/plan': { hasPaidSubscription: () => mode !== 'unpaid' },
    '@/lib/db/client': { prisma: {
      user: { findUnique: async () => ({ id: 'fixture-user', subscription: {}, profile: {} }) },
      profile: { upsert: async (args) => {
        writes++;
        if (mode !== 'healthkit') throw Error('Unexpected profile write');
        assert.equal(args.where.userId, 'fixture-user');
        assert.equal(args.update.pasMoyenParJour, 7500);
        assert.equal(args.update.resumeMontre, 'Synchronisé automatiquement via Apple Santé.');
        return args.update;
      } },
    } },
    '@/lib/ai/client': { generateWithVision: async () => { aiCalls++; throw providerError; } },
    ['@/lib/ai/prompts/' + promptModule]: { [promptFunction]: () => 'synthetic-prompt' },
  };
  const box = { exports: {}, File, Buffer, Date, Set, console: {
    error: (...args) => logs.push(args), warn: (...args) => logs.push(args),
  }, require: key => { assert.ok(key in dependencies, key); return dependencies[key]; } };
  const source = fs.readFileSync(path.join(root, 'src/app/api', route, 'route.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, box);
  const body = new FormData();
  body.append('file', new File(mode === 'empty-file' ? [] : ['synthetic-image-only'], 'fixture.png', { type: 'image/png' }));
  body.append('exercice', 'Squat');
  const headers = mode === 'no-consent' ? {}
    : mode === 'wrong-scope' ? consent.aiImageConsentHeaders(scopes[route] === 'menu' ? 'repas' : 'menu', true)
    : mode === 'old-consent' ? { [consent.AI_IMAGE_CONSENT_HEADER]: 'anthropic-image-v0:' + scopes[route] }
    : consent.aiImageConsentHeaders(scopes[route], true);
  const requestOptions = mode === 'healthkit'
    ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: 'healthkit', pasMoyenParJour: 7500 }) }
    : mode === 'broken-form' ? { method: 'POST', headers: { ...headers, 'content-type': 'multipart/form-data; boundary=interrupted' }, body: '--interrupted\r\nPRIVATE-truncated-body' }
    : mode === 'broken-healthkit' ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{PRIVATE-broken-json' }
    : { method: 'POST', headers, body };
  const response = await box.exports.POST(new Request('http://localhost/api/' + route, requestOptions));
  const payload = await response.text();
  if (mode === 'healthkit') {
    assert.equal(response.status, 200);
    assert.equal(writes, 1);
    assert.equal(aiCalls, 0);
    assert.equal(logs.length, 0);
    assert.equal(JSON.parse(payload).pasMoyenParJour, 7500);
    return;
  }
  assert.equal(writes, 0, route + ': failures must not update the profile');
  assert.ok(!payload.includes('PRIVATE'), route + ': response leaked provider content');
  if (['empty-file', 'broken-form', 'broken-healthkit'].includes(mode)) {
    assert.equal(response.status, 400, route + ': invalid upload should give a recoverable client error');
    assert.equal(typeof JSON.parse(payload).error, 'string');
    assert.equal(aiCalls, 0);
    assert.equal(logs.length, 0);
    return;
  }
  if (mode === 'provider-error') {
    assert.equal(response.status, 502);
    assert.equal(aiCalls, 1);
    assert.deepEqual(logs, [[ '[' + route + '] Échec de l\'extraction IA' ]]);
  } else {
    assert.ok([401, 402, 403].includes(response.status));
    assert.equal(aiCalls, 0);
    assert.equal(logs.length, 0);
    if (['no-consent', 'wrong-scope', 'old-consent'].includes(mode)) {
      assert.equal(response.status, 403);
      assert.equal(JSON.parse(payload).code, 'AI_IMAGE_CONSENT_REQUIRED');
    }
  }
}
(async () => {
  for (const item of cases) for (const mode of ['provider-error', 'unauthenticated', 'unpaid', 'no-consent', 'wrong-scope', 'old-consent', 'empty-file', 'broken-form']) await exercise(item, mode);
  await exercise(cases.find(item => item[0] === 'profil/montre'), 'healthkit');
  await exercise(cases.find(item => item[0] === 'profil/montre'), 'broken-healthkit');
  console.log('PASS — five real vision routes, 42 cases: consent and auth gates, private errors excluded, interrupted/empty uploads rejected without AI or writes; structured HealthKit stays AI-free. All providers simulated.');
})().catch(error => { console.error(error); process.exitCode = 1; });
