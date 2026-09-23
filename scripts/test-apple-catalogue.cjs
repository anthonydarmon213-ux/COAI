const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
function load(file, modules = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    assert(Object.hasOwn(modules, name), `Unexpected dependency: ${name}`);
    return modules[name];
  } });
  return exports;
}
const catalogue = load('src/lib/subscription/apple-catalogue.ts');
const plain = value => JSON.parse(JSON.stringify(value));
async function main() {
  const terms = plain(catalogue.APPLE_ESSENTIEL_CATALOGUE);
  assert.equal(terms.plan, 'PASS_IA');
  assert.deepEqual(terms.products.map(p => [p.period, p.francePriceCents]), [['P1M', 1999], ['P1Y', 11900]]);
  assert.equal(new Set(terms.products.map(p => p.id)).size, 2);
  assert.deepEqual(plain(catalogue.APPLE_ESSENTIEL_PRODUCT_IDS), terms.products.map(p => p.id));
  assert.deepEqual(terms.introductoryOffer, { mode: 'freeTrial', period: 'P7D', eligibility: 'storekit' });
  const exposed = catalogue.appleClientCatalogue();
  assert(!JSON.stringify(exposed).includes('Price'));
  exposed.products[0].id = 'tampered';
  assert.notEqual(catalogue.appleClientCatalogue().products[0].id, 'tampered');
  for (const state of ['anonymous', 'authenticated', 'error']) {
    const route = load('src/app/api/ios/apple/catalogue/route.ts', {
      'next/server': { NextResponse },
      '@/lib/subscription/apple-catalogue': catalogue,
      '@/lib/auth/server': { getCurrentUser: async () => {
        if (state === 'error') throw Error('PRIVATE_FAILURE');
        return state === 'authenticated' ? { id: 'verified-user' } : null;
      } },
    });
    const result = await route.GET();
    assert.equal(result.status, state === 'authenticated' ? 200 : state === 'anonymous' ? 401 : 503);
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
    assert.match(result.headers.get('vary'), /Authorization/);
    const body = await result.json();
    assert(!JSON.stringify(body).includes('PRIVATE_FAILURE'));
    if (state === 'authenticated') assert.deepEqual(body, plain(catalogue.appleClientCatalogue()));
    else assert.equal(body.products, undefined);
  }
  console.log('PASS: approved Apple terms, isolated public DTO, authenticated catalogue route and safe errors. Auth mocked; no purchase tested.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
