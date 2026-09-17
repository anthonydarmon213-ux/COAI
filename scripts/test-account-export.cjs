const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/app/api/compte/export/route.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const expected = ['profile', 'subscription', 'programmes', 'seances', 'mesures', 'whatsappEvents',
  'repasLogs', 'avis', 'testsMaxi', 'weeklyCheckins', 'adaptations', 'activitesJournalieres',
  'dailySessions', 'recuperationsMusculaires', 'programmePurchases', 'routines', 'formChecks', 'churnFeedback'];
async function scenario({ signedIn = true, missing = false, authError = false, dbError = false, id = 'owner-a' } = {}) {
  let calls = 0;
  const api = {};
  vm.runInNewContext(source, { exports: api, require(name) {
    if (name === 'next/server') return { NextResponse };
    if (name === '@/lib/auth/server') return { getCurrentUser: async () => {
      if (authError) throw new Error('PRIVATE_AUTH_DETAIL');
      return signedIn ? { id } : null;
    }};
    if (name === '@/lib/db/client') return { prisma: { user: { findUnique: async (query) => {
      calls++;
      assert.equal(JSON.stringify(query.where), JSON.stringify({ supabaseAuthId: id }));
      assert.deepEqual(Object.keys(query.include).sort(), [...expected].sort());
      assert.ok(Object.values(query.include).every(value => value === true), 'No nested third-party joins');
      if (dbError) throw new Error('PRIVATE_DATABASE_DETAIL');
      if (missing) return null;
      return { id, ...Object.fromEntries(expected.map(key => [key, [{ fixture: key, owner: id }]])) };
    }}}};
    throw new Error(`Unexpected dependency ${name}`);
  }});
  assert.equal(api.dynamic, 'force-dynamic');
  const response = await api.GET(new Request('https://coai.test/api/compte/export?userId=another-account'));
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const body = await response.json();
  assert.ok(!JSON.stringify(body).includes('PRIVATE_'));
  return { status: response.status, body, calls };
}
(async () => {
  for (const id of ['owner-a', 'owner-b']) {
    const result = await scenario({ id });
    assert.equal(result.status, 200);
    assert.equal(result.body.id, id);
    for (const key of expected) assert.equal(result.body[key][0].owner, id);
  }
  for (const [options, status, calls] of [
    [{ signedIn: false }, 401, 0], [{ missing: true }, 404, 1],
    [{ authError: true }, 503, 0], [{ dbError: true }, 503, 1],
  ]) {
    const result = await scenario(options);
    assert.equal(result.status, status);
    assert.equal(result.calls, calls);
    assert.deepEqual(Object.keys(result.body), ['error']);
  }
  console.log('PASS: export of 18 account relations, owner binding, no nested joins, no-cache and safe failures. Auth/DB mocked; no production account accessed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
