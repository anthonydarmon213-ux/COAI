const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
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
    '@/lib/auth/server': { getCurrentUser: async () => mode === 'unauthenticated' ? null : { id: 'fixture-auth' } },
    '@/lib/subscription/plan': { hasPaidSubscription: () => mode !== 'unpaid' },
    '@/lib/db/client': { prisma: {
      user: { findUnique: async () => ({ id: 'fixture-user', subscription: {}, profile: {} }) },
      profile: { upsert: async () => { writes++; throw Error('Unexpected profile write'); } },
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
  body.append('file', new File(['synthetic-image-only'], 'fixture.png', { type: 'image/png' }));
  body.append('exercice', 'Squat');
  const response = await box.exports.POST(new Request('http://localhost/api/' + route, { method: 'POST', body }));
  const payload = await response.text();
  assert.equal(writes, 0, route + ': failures must not update the profile');
  assert.ok(!payload.includes('PRIVATE'), route + ': response leaked provider content');
  if (mode === 'provider-error') {
    assert.equal(response.status, 502);
    assert.equal(aiCalls, 1);
    assert.deepEqual(logs, [[ '[' + route + '] Échec de l\'extraction IA' ]]);
  } else {
    assert.ok([401, 402, 403].includes(response.status));
    assert.equal(aiCalls, 0);
    assert.equal(logs.length, 0);
  }
}
(async () => {
  for (const item of cases) for (const mode of ['provider-error', 'unauthenticated', 'unpaid']) await exercise(item, mode);
  console.log('PASS — five real vision routes, 15 cases: private provider error excluded from logs/responses, no profile mutation, auth/payment gates preserved. All providers simulated.');
})().catch(error => { console.error(error); process.exitCode = 1; });
