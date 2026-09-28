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
    await registry.reservePhotoWrite(id);
    await prisma.$disconnect();
    await assert.rejects(registry.closePhotoWrites(id), /photo_writes_unresolved/);
    await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
    await assert.rejects(registry.confirmPhotoWrite(id, 'unknown'), /photo_reservation_missing/);
    for (const table of ['photo_owner_gates', 'photo_uploads']) {
      const rows = await prisma.$queryRaw`SELECT has_table_privilege('anon', ${'public.' + table}, 'SELECT,INSERT,UPDATE,DELETE') AS anon,
        has_table_privilege('authenticated', ${'public.' + table}, 'SELECT,INSERT,UPDATE,DELETE') AS member`;
      assert.equal(rows[0].anon, false); assert.equal(rows[0].member, false);
    }
    console.log('PASS actual modules + local PostgreSQL: delayed body, in-flight upload, deletion retry, durable closed gate, unresolved write after reconnect, owner isolation and private tables. Storage simulated; not production.');
  } finally {
    for (const id of owners) {
      const key = crypto.createHash('sha256').update('coai-photo-owner-v1:' + id).digest('hex');
      await prisma.$executeRaw`DELETE FROM photo_uploads WHERE "ownerKey"=${key}`;
      await prisma.$executeRaw`DELETE FROM photo_owner_gates WHERE "ownerKey"=${key}`;
    }
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
