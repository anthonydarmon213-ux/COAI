const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadRecipeModule(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (!name.startsWith('.')) throw Error(`Unexpected recipe import: ${name}`);
    return loadRecipeModule(path.resolve(path.dirname(file), name + '.ts'));
  } });
  return exports;
}

const realRecipes = loadRecipeModule(path.resolve('src/lib/nutrition/recettes.ts')).RECETTES;
assert.ok(realRecipes.length > 3 && realRecipes.length <= 200);
for (const recipe of realRecipes) {
  assert.match(recipe.slug, /^[a-z0-9-]{1,100}$/);
  if (recipe.photoLocale) {
    assert.match(recipe.photoLocale, /^\/repas\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/);
    assert.ok(fs.existsSync(path.resolve('public', recipe.photoLocale.slice(1))),
      `Missing COAI recipe photo: ${recipe.photoLocale}`);
  }
}
const recipes = realRecipes.map((recipe, index) => index === 0
  ? { ...recipe, privateNote: 'ne doit pas sortir' }
  : recipe);

function loadRoute(signedIn, paid, fail) {
  const exports = {};
  const source = fs.readFileSync('src/app/api/ios/nutrition/recettes/route.ts', 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    console: { error() {} },
    require(name) {
      switch (name) {
        case 'next/server': return { NextResponse: { json: (body, init = {}) =>
          new Response(JSON.stringify(body), init) } };
        case '@/lib/auth/server': return { getCurrentAppUser: async () => {
          if (fail) throw Error('private auth detail');
          return signedIn ? { id: 'owner-fixture', subscription: paid ? { status: 'ACTIVE' } : null } : null;
        } };
        case '@/lib/subscription/plan': return { hasCatalogueAccess: subscription =>
          subscription?.status === 'ACTIVE' };
        case '@/lib/nutrition/recettes': return { RECETTES: recipes };
        default: throw Error(`Unexpected import: ${name}`);
      }
    },
  });
  return exports;
}

(async () => {
  for (const [signedIn, paid, fail, expectedStatus, expectedCount] of [
    [false, false, false, 401, null],
    [true, false, false, 200, 3],
    [true, true, false, 200, recipes.length],
    [true, false, true, 503, null],
  ]) {
    const response = await loadRoute(signedIn, paid, fail).GET();
    assert.equal(response.status, expectedStatus);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('vary'), 'Cookie, Authorization');
    const body = await response.json();
    assert.ok(!JSON.stringify(body).includes('privateNote'));
    assert.ok(!JSON.stringify(body).includes('private auth detail'));
    if (expectedCount !== null) {
      assert.equal(body.recipes.length, expectedCount);
      assert.equal(body.fullCatalogue, paid);
      assert.equal(body.total, recipes.length);
      assert.ok(Buffer.byteLength(JSON.stringify(body), 'utf8') <= 256 * 1024,
        'The full catalogue must fit the iPhone response limit');
    }
  }
  console.log(`PASS: 4 nutrition API scenarios; ${recipes.length} real recipes, photos, access and native size limit.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
