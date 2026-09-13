const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

// Exécute le vrai middleware sans appeler un service ni lire de secret.
let user = null;
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, URL, process: { env: {} },
    require: (name) => imports[name] || require(name),
  });
  return exports;
}
const { middleware } = load('src/middleware.ts', {
  '@supabase/ssr': { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
});
const { sanitizeReturnTo } = load('src/lib/auth/safe-redirect.ts');
const routes = [
  '/bienvenue?plan=PASS_IA&billing=ANNUAL&essai=1&session_id=cs_test_audit',
  '/programme/seance-du-jour?seance=2',
  '/completer-inscription?redirect_to=%2Fpricing%3Fbilling%3DANNUAL',
  '/dashboard',
  '/programme/seance-du-jour?note=a%26b&seance=0',
];
(async () => {
  for (const route of routes) {
    const response = await middleware(new NextRequest('https://coai.fr' + route));
    assert.equal(response.status, 307);
    const target = new URL(response.headers.get('location'));
    assert.equal(target.origin, 'https://coai.fr');
    assert.equal(target.pathname, '/sign-in');
    assert.equal(target.searchParams.get('redirect_to'), route);
    assert.equal(sanitizeReturnTo(target.searchParams.get('redirect_to')), route);
  }
  for (const route of ['/pricing?billing=ANNUAL', '/videos/exercices/demo.mp4']) {
    assert.equal((await middleware(new NextRequest('https://coai.fr' + route))).headers.get('location'), null);
  }
  user = { id: 'test-user' };
  for (const route of routes) {
    assert.equal((await middleware(new NextRequest('https://coai.fr' + route))).headers.get('location'), null);
  }
  for (const unsafe of ['https://example.com', '//example.com', '/\\example.com']) {
    assert.equal(sanitizeReturnTo(unsafe), null);
  }
  console.log('PASS : paramètres conservés, routes protégées, connexion et destinations externes contrôlées.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
