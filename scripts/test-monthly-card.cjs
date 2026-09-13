// Real PNG renderer; authentication and database are fixtures. No network/payment.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
let signedIn = true, count = 1;
const box = { exports: {}, require: name =>
  name === '@/lib/auth/server' ? { getCurrentUser: async () => signedIn ? { id: 'fixture' } : null } :
  name === '@/lib/db/client' ? { prisma: { seanceLog: { findMany: async args => {
    assert.equal(args.where.user.supabaseAuthId, 'fixture');
    return Array.from({ length: count }, () => ({ date: new Date() }));
  } } } } : require(name) };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/suivi/bilan-mensuel/carte/route.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
(async () => {
  for (count of [1, 2, 100]) {
    const response = await box.exports.GET();
    const png = Buffer.from(await response.arrayBuffer());
    assert.equal(response.status, 200);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 1080);
    assert.equal(png.readUInt32BE(20), 1080);
  }
  count = 0;
  assert.equal((await box.exports.GET()).status, 404);
  signedIn = false;
  assert.equal((await box.exports.GET()).status, 401);
  console.log('PASS: real PNG rendering for 1/2/100 sessions, empty and anonymous guards');
})().catch(error => { console.error(error); process.exitCode = 1; });
