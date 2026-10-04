// Explicitly local PostgreSQL; real application modules, simulated Storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
if (!process.argv.includes('--local')) throw Error('Explicit --local required');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' } } });
const owners = [];
function owner() { const id = crypto.randomUUID(); owners.push(id); return id; }
function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/storage/', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw Error(`Unexpected import ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const registry = load('photo-write-registry.ts', { 'node:crypto': crypto, '@/lib/db/client': { prisma } });
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
async function scenario(method, delayBody) {
  const id = owner(), files = new Map([['other/photo.jpg', 'untouched']]);
  const entered = deferred(), resume = deferred();
  const bucket = {
    upload: async name => {
      if (!delayBody) { entered.resolve(); await resume.promise; }
      files.set(name, 'photo'); return { error: null };
    },
    list: async prefix => ({ data: [...files.keys()].filter(p => p.startsWith(prefix + '/')).map(p => ({ id: p, name: p.split('/')[1] })), error: null }),
    remove: async paths => { paths.forEach(p => files.delete(p)); return { error: null }; },
  };
  const api = load('progress-photos.ts', {
    './photo-write-registry': registry,
    '@/lib/auth/admin': { createSupabaseAdminClient: () => ({ storage: { from: () => bucket } }) },
  });
  const uploading = api[method](id, { type: 'image/jpeg', arrayBuffer: async () => {
    if (delayBody) { entered.resolve(); await resume.promise; }
    return new ArrayBuffer(1);
  } });
  await entered.promise;
  if (delayBody) {
    await api.deleteAllProgressPhotos(id);
    resume.resolve();
    await assert.rejects(uploading, /photo_owner_deleting/);
  } else {
    await assert.rejects(api.deleteAllProgressPhotos(id), /photo_writes_unresolved/);
    await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
    resume.resolve(); await uploading;
    await api.deleteAllProgressPhotos(id);
  }
  assert.deepEqual([...files.keys()], ['other/photo.jpg']);
  await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
}
(async () => {
  try {
    for (const method of ['uploadAvatar', 'uploadProgressPhoto']) {
      await scenario(method, true); await scenario(method, false);
    }
    const id = owner();
    const neverStarted = await registry.reservePhotoWrite(id);
    await prisma.$disconnect();
    // A reservation alone must not block deletion forever. The durable gate
    // must also prevent a suspended caller from dispatching after this close.
    await registry.closePhotoWrites(id);
    await assert.rejects(registry.beginPhotoWrite(id, neverStarted), /photo_owner_deleting/);
    await assert.rejects(registry.confirmPhotoWrite(id, neverStarted), /photo_reservation_missing/);
    await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
    await assert.rejects(registry.confirmPhotoWrite(id, 'unknown'), /photo_reservation_missing/);
    const active = owner(), foreign = owner();
    const claimed = await registry.reservePhotoWrite(active);
    await assert.rejects(registry.beginPhotoWrite(foreign, claimed), /photo_dispatch_not_available/);
    await assert.rejects(registry.confirmPhotoWrite(active, claimed), /photo_reservation_missing/);
    const claims = await Promise.allSettled([
      registry.beginPhotoWrite(active, claimed), registry.beginPhotoWrite(active, claimed),
    ]);
    assert.equal(claims.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(claims.filter(r => r.status === 'rejected').length, 1);
    const cancelled = await registry.reservePhotoWrite(active);
    await assert.rejects(registry.closePhotoWrites(active), /photo_writes_unresolved/);
    await assert.rejects(registry.confirmPhotoWrite(active, cancelled), /photo_reservation_missing/);
    await assert.rejects(registry.beginPhotoWrite(active, cancelled), /photo_owner_deleting/);
    await registry.confirmPhotoWrite(active, claimed);
    await registry.closePhotoWrites(active);
    // Older writers omit the new column: default true protects their unknown
    // outcome, including legacy rows migrated before this code is deployed.
    const legacy = owner(), legacyId = crypto.randomUUID();
    const legacyKey = crypto.createHash('sha256').update('coai-photo-owner-v1:' + legacy).digest('hex');
    await prisma.$executeRaw`INSERT INTO photo_owner_gates ("ownerKey") VALUES (${legacyKey})`;
    await prisma.$executeRaw`INSERT INTO photo_uploads (id, "ownerKey") VALUES (${legacyId}, ${legacyKey})`;
    await assert.rejects(registry.closePhotoWrites(legacy), /photo_writes_unresolved/);
    for (const table of ['photo_owner_gates', 'photo_uploads']) {
      const rows = await prisma.$queryRaw`SELECT has_table_privilege('anon', ${'public.' + table}, 'SELECT,INSERT,UPDATE,DELETE') AS anon,
        has_table_privilege('authenticated', ${'public.' + table}, 'SELECT,INSERT,UPDATE,DELETE') AS member`;
      assert.equal(rows[0].anon, false); assert.equal(rows[0].member, false);
    }
    console.log('PASS actual modules + local PostgreSQL: body delay, admitted upload, cancelled reservation after reconnect, single dispatch claim, foreign owner rejected, legacy reservations preserved, durable closed gate and private tables. Storage simulated; not production.');
  } finally {
    for (const id of owners) {
      const key = crypto.createHash('sha256').update('coai-photo-owner-v1:' + id).digest('hex');
      await prisma.$executeRaw`DELETE FROM photo_uploads WHERE "ownerKey"=${key}`;
      await prisma.$executeRaw`DELETE FROM photo_owner_gates WHERE "ownerKey"=${key}`;
    }
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
