// Execute actual image routes/rendering. Auth and DB mocked; no real user data changed.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
let signedIn = true, exists = true;
function load(path, prisma) {
  const box = { exports: {}, require: n => n === '@/lib/auth/server' ? { getCurrentUser: async () => signedIn ? { id: 'fixture' } : null } : n === '@/lib/db/client' ? { prisma } : require(n) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, box);
  return box.exports.GET;
}
const daily = load('src/app/api/daily/carte/route.tsx', {
  user: { findUnique: async () => ({ id: 'fixture' }) },
  dailySession: { findUnique: async args => { assert.equal(args.where.userId_date.userId, 'fixture'); return exists ? { completedAt: new Date(), workoutRating: 'BIEN_DOSEE', availableMinutes: 45 } : null; }, count: async () => 2 },
});
const adaptation = load('src/app/api/programmes/adaptations/[id]/carte/route.tsx', {
  programmeAdaptation: { findFirst: async args => { assert.equal(args.where.user.supabaseAuthId, 'fixture'); return exists ? { pilier: 'ENTRAINEMENT', decision: 'GARDER', resume: 'Programme maintenu.', createdAt: new Date() } : null; } },
});
(async () => {
  for (const route of [daily, adaptation]) {
    const response = await route(null, { params: { id: 'fixture' } });
    const png = Buffer.from(await response.arrayBuffer());
    assert.equal(response.status, 200); assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1080);
  }
  exists = false;
  assert.equal((await daily()).status, 409);
  assert.equal((await adaptation(null, { params: { id: 'fixture' } })).status, 404);
  signedIn = false;
  assert.equal((await daily()).status, 401); assert.equal((await adaptation(null, { params: { id: 'fixture' } })).status, 401);
  console.log('PASS: daily/adaptation real PNG render and missing/anonymous guards');
})().catch(e => { console.error(e); process.exitCode = 1; });
