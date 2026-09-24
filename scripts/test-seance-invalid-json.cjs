// Actual route, mocked authentication/database: invalid payloads never write.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let authenticated = true;
let databaseCalls = 0;
const imports = {
  'next/server': require('next/server'),
  zod: require('zod'),
  '@/lib/auth/server': {getCurrentUser: async () => authenticated ? {id: 'local-test'} : null},
  '@/lib/db/client': {prisma: {user: {findUnique: async () => { databaseCalls++; throw Error('Unexpected database access'); }}}},
  '@/lib/analytics/product-events': {trackServerEvent: () => assert.fail('Unexpected event')},
};
const box = {exports: {}, require: name => {assert(name in imports); return imports[name];}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/seances/route.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS},
}).outputText, box);
const request = body => new Request('http://localhost/api/seances', {
  method: 'POST', headers: {'Content-Type': 'application/json'}, body,
});
(async () => {
  for (const body of ['{', '', '{"date":', 'not json']) {
    const response = await box.exports.POST(request(body));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {error: 'Données de séance illisibles. Réessaie l’enregistrement.'});
  }
  for (const body of ['null', '[]', '{}', '{"date":"invalid","exercices":[]}']) {
    assert.equal((await box.exports.POST(request(body))).status, 400);
  }
  authenticated = false;
  assert.equal((await box.exports.POST(request('{'))).status, 401);
  assert.equal(databaseCalls, 0);
  console.log('PASS: malformed/empty JSON and invalid schema rejected; authentication remains first; no database/event side effects');
})().catch(error => {console.error(error); process.exitCode = 1;});
