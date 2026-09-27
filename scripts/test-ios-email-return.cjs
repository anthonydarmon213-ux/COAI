const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsBox = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/auth/ios-confirmation/route.ts','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsBox, URL, Response });
(async () => {
  for (const query of ['code=abc_123-XYZ', '', 'code=', 'code=a&code=b', 'code=a&redirect_to=https://evil.test',
    'code=%22%3E%3Cscript%3E', 'access_token=secret', 'error=otp_expired', 'code='+'a'.repeat(2049)]) {
    const response = exportsBox.GET(new Request('https://coai.fr/auth/ios-confirmation?'+query));
    const html = await response.text();
    const valid = query === 'code=abc_123-XYZ';
    assert.equal(response.status,valid ? 200 : 400);
    assert.equal(html.includes('fr.coai.mobile://auth/email-confirmation?code=abc_123-XYZ'),valid);
    if(!valid) assert(!html.includes('fr.coai.mobile://'));
    assert(!html.includes('<script'));
    assert.equal(response.headers.get('referrer-policy'),'no-referrer');
    assert.equal(response.headers.get('cache-control'),'private, no-store');
    assert(response.headers.get('content-security-policy').includes("default-src 'none'"));
    assert.equal(response.headers.get('set-cookie'),null);
  }
  console.log('PASS iOS email return: fixed deep link, invalid/duplicate/injected codes refused, no scripts/session/caching/referrer. OS opening not covered.');
})().catch(error=>{console.error(error);process.exitCode=1;});
