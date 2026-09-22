const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const out = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/invitation/[code]/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: out, require, URL, process });
(async () => {
  for (const suffix of ['', '?score=', '?score=%20', '?score=101', '?score=-1', '?score=abc']) {
    const response = await out.GET(new Request('https://coai.fr/invitation/ABCDEFG' + suffix), { params: Promise.resolve({ code: 'abcdefg' }) });
    const url = new URL(response.headers.get('location'));
    assert.equal(url.pathname, '/diagnostic');
    assert.equal(url.searchParams.has('challenge_score'), false, suffix);
    assert.equal(response.cookies.get('coai_ref').value, 'ABCDEFG');
  }
  for (const score of [0, 50, 100]) {
    const response = await out.GET(new Request('https://coai.fr/invitation/INVALID?score=' + score), { params: Promise.resolve({ code: 'INVALID' }) });
    assert.equal(new URL(response.headers.get('location')).searchParams.get('challenge_score'), String(score));
    assert.equal(response.cookies.get('coai_ref'), undefined);
  }
  console.log('PASS: invitation asynchronous params, absent/invalid score and referral cookie (9 cases).');
})().catch(error => { console.error(error); process.exitCode = 1; });
