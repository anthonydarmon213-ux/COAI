// Real local Storage + PostgreSQL, with the successful HTTP upload response lost.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const url = new URL(process.env.DATABASE_URL);
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '54322');
const prisma = new PrismaClient();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = admin.storage.from('progress photos');
const owners = [];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
function load(file, imports) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/storage/', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: key => {
    if (!(key in imports)) throw Error('Unexpected import ' + key);
    return imports[key];
  } });
  return exports;
}
const registry = load('photo-write-registry.ts', { 'node:crypto': crypto, '@/lib/db/client': { prisma } });
(async () => {
  try {
    for (const method of ['uploadAvatar', 'uploadProgressPhoto']) {
      const id = 'lost-response-' + crypto.randomUUID(); owners.push(id);
      let lost = false;
      const unreliable = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: async (input, init) => {
          const target = new URL(typeof input === 'string' ? input : input.url);
          assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.port, '54321');
          const response = await fetch(input, init);
          if (!lost && init?.method === 'POST' && target.pathname.startsWith('/storage/v1/object/progress%20photos/')) {
            assert(response.ok, 'The local fixture upload must really succeed before losing its response');
            await response.arrayBuffer(); lost = true;
            throw new TypeError('Synthetic loss of successful upload response');
          }
          return response;
        } },
      });
      const api = load('progress-photos.ts', { './photo-write-registry': registry,
        '@/lib/auth/admin': { createSupabaseAdminClient: () => unreliable } });
      const result = await api[method](id, { type: 'image/png', arrayBuffer: async () => png });
      assert.equal(lost, true); assert('path' in result, 'Positive operation proof must recover the lost response');
      const before = await bucket.list(id); assert.equal(before.error, null); assert.equal(before.data.length, 1);
      await api.deleteAllProgressPhotos(id);
      await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
      const after = await bucket.list(id); assert.equal(after.data.length, 0);
      console.log(`PASS ${method}: real file stored, response lost, exact operation proof recovered, deletion completed, gate remains closed.`);
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
