const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/app/api/check-in-hebdo/route.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
let authenticated = true, databaseReads = 0, writes = 0;
const dependencies = {
  'next/server': { NextResponse: Response },
  zod: require('zod'),
  '@/lib/auth/server': { getCurrentUser: async () => authenticated ? { id: 'auth-test' } : null },
  '@/lib/db/client': { prisma: {
    user: { findUnique: async () => { databaseReads++; return { id: 'user-test' }; } },
    weeklyCheckin: { upsert: async args => { writes++; assert.equal(args.create.userId, 'user-test'); return args.create; } },
  } },
  '@/lib/checkin/semaine': { lundiDeSemaine: () => new Date('2026-09-21T00:00:00Z') },
  '@/lib/analytics/product-events': { trackServerEvent: () => {} },
};
const box = { exports: {}, require: id => { if (!(id in dependencies)) throw Error(id); return dependencies[id]; } };
vm.runInNewContext(code, box);
const post = body => box.exports.POST(new Request('http://localhost/api/check-in-hebdo', { method: 'POST', body }));
(async () => {
  for (const body of ['', '{', 'null', '{"energie":9}']) {
    const response = await post(body);
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
  assert.equal(databaseReads, 0); assert.equal(writes, 0);
  authenticated = false;
  assert.equal((await post('{')).status, 401);
  authenticated = true;
  const response = await post('{"energie":3,"userId":"someone-else"}');
  assert.equal(response.status, 201);
  assert.equal((await response.json()).userId, 'user-test');
  assert.equal(writes, 1);
  console.log('PASS: malformed check-ins rejected before DB; auth and valid submission preserved (mock DB).');
})().catch(error => { console.error(error); process.exitCode = 1; });
