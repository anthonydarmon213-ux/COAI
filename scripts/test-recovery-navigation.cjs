const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file) {
  const exports = {};
  const source = fs.readFileSync(file, 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText, { exports, URL, URLSearchParams,
    require: name => load(path.resolve(path.dirname(file), name + '.ts')),
  });
  return exports;
}
const { recoveryHref, recoveryError } = load(path.join(__dirname, '../src/lib/auth/recovery-navigation.ts'));
for (const destination of ['/programme/seance-du-jour?seance=2', '/bienvenue?plan=PASS_IA&billing=ANNUAL&session_id=cs_test_audit']) {
  let current = destination;
  for (const page of ['/mot-de-passe-oublie', '/reinitialiser-mot-de-passe', '/sign-in']) {
    const url = new URL(recoveryHref(page, current, page === '/sign-in'), 'https://coai.fr');
    assert.equal(url.pathname, page);
    current = url.searchParams.get('redirect_to');
    assert.equal(current, destination);
    if (page === '/sign-in') assert.equal(url.searchParams.get('password_reset'), 'success');
  }
}
for (const unsafe of [null, 'https://example.com', '//example.com', '/\\example.com']) {
  assert.equal(recoveryHref('/sign-in', unsafe), '/sign-in');
}
assert.match(recoveryError({code:'same_password'}), /différent/);
assert.match(recoveryError({code:'weak_password'}), /8 caractères/);
assert.match(recoveryError({code:'over_email_send_rate_limit'}), /Patiente/);
assert.equal(recoveryError(new Error('internal private error')).includes('private'), false);
console.log('PASS : parcours récupération, destination, succès et messages français.');
