// Kill only a disposable child writer; actual loopback Storage/PostgreSQL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const database = new URL(process.env.DATABASE_URL);
assert.equal(database.hostname, '127.0.0.1'); assert.equal(database.port, '54322');
const prisma = new PrismaClient();
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const bucket = admin.storage.from('progress photos');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
function load(file, imports) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/storage/', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in imports)) throw Error('Unexpected import ' + name);
    return imports[name];
  } });
  return exports;
}
const registry = load('photo-write-registry.ts', { 'node:crypto': crypto, '@/lib/db/client': { prisma } });
function api(client) { return load('progress-photos.ts', {
  './photo-write-registry': registry, '@/lib/auth/admin': { createSupabaseAdminClient: () => client },
}); }
if (process.argv[2] === '--writer') {
  const [id, method, mode] = process.argv.slice(3);
  assert(/^crash-test-[a-f0-9-]+$/.test(id));
  assert(['uploadAvatar', 'uploadProgressPhoto'].includes(method));
  const crashing = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    ...options, global: { fetch: async (input, init) => {
      const target = new URL(typeof input === 'string' ? input : input.url);
      assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.port, '54321');
      assert.equal(init.method, 'POST');
      assert(target.pathname.startsWith('/storage/v1/object/progress%20photos/'));
      if (mode === 'before-upload') process.exit(74);
      const response = await fetch(input, init);
      assert(response.ok); await response.arrayBuffer();
      // Abrupt process death: no catch/finally, no confirmation, no cleanup.
      process.exit(73);
    } },
  });
  api(crashing)[method](id, { type: 'image/png', arrayBuffer: async () => png })
    .then(() => { throw Error('Writer should have exited'); }).catch(e => { console.error(e); process.exitCode = 1; });
} else {
  const owners = [];
  (async () => {
    try {
      for (const method of ['uploadAvatar', 'uploadProgressPhoto']) {
        for (const mode of ['after-upload', 'before-upload', 'wrong-proof']) {
          const id = 'crash-test-' + crypto.randomUUID(); owners.push(id);
          const child = spawnSync(process.execPath, [__filename, '--writer', id, method, mode], {
            env: process.env, stdio: 'pipe', timeout: 20000,
          });
          assert.equal(child.status, mode === 'before-upload' ? 74 : 73, child.stderr?.toString());
          let stored = await bucket.list(id); assert.equal(stored.error, null);
          assert.equal(stored.data.length, mode === 'before-upload' ? 0 : 1);
          if (mode === 'wrong-proof') {
            const filePath = `${id}/${stored.data[0].name}`;
            assert.equal((await bucket.upload(filePath, png, { upsert: true, contentType: 'image/png',
              metadata: { coaiUploadOperation: crypto.randomUUID() } })).error, null);
          }
          if (mode === 'after-upload') {
            await api(admin).deleteAllProgressPhotos(id);
            stored = await bucket.list(id); assert.equal(stored.data.length, 0);
          } else {
            await assert.rejects(api(admin).deleteAllProgressPhotos(id), /photo_writes_unresolved/);
          }
          await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
          console.log(`PASS ${method}/${mode}: ${mode === 'after-upload' ? 'new process recovered exact proof and removed file' : 'no false completion without proof'}`);
        }
      }
    } finally {
      for (const id of owners) {
        const listed = await bucket.list(id); assert.equal(listed.error, null);
        if (listed.data.length) assert.equal((await bucket.remove(listed.data.map(f => `${id}/${f.name}`))).error, null);
        const key = crypto.createHash('sha256').update('coai-photo-owner-v1:' + id).digest('hex');
        await prisma.$executeRaw`DELETE FROM photo_uploads WHERE "ownerKey"=${key}`;
        await prisma.$executeRaw`DELETE FROM photo_owner_gates WHERE "ownerKey"=${key}`;
      }
      await prisma.$disconnect();
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
