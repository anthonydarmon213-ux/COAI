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
function api(client, coordination = registry) { return load('progress-photos.ts', {
  './photo-write-registry': coordination, '@/lib/auth/admin': { createSupabaseAdminClient: () => client },
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
  const coordination = mode === 'after-reservation' ? { ...registry,
    reservePhotoWrite: async owner => {
      await registry.reservePhotoWrite(owner);
      process.exit(75); // No dispatch claim and no HTTP request yet.
    },
  } : registry;
  api(crashing, coordination)[method](id, { type: 'image/png', arrayBuffer: async () => png })
    .then(() => { throw Error('Writer should have exited'); }).catch(e => { console.error(e); process.exitCode = 1; });
} else {
  const owners = [];
  (async () => {
    try {
      // A suspended caller cannot start Storage after deletion cancels its
      // unclaimed reservation. Exercise the real app wrapper, not a manual gate.
      for (const method of ['uploadAvatar', 'uploadProgressPhoto']) {
        const id = 'crash-test-' + crypto.randomUUID(); owners.push(id);
        let entered, release, httpCalls = 0;
        const ready = new Promise(resolve => { entered = resolve; });
        const held = new Promise(resolve => { release = resolve; });
        const guardedClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          ...options, global: { fetch: async () => { httpCalls++; throw Error('No HTTP allowed after reservation cancellation'); } },
        });
        const writing = api(guardedClient, { ...registry, reservePhotoWrite: async owner => {
          const operation = await registry.reservePhotoWrite(owner);
          entered(); await held; return operation;
        } })[method](id, { type: 'image/png', arrayBuffer: async () => png });
        // Install rejection observation before releasing the suspended caller.
        const outcome = writing.then(value => ({ value }), error => ({ error }));
        try {
          await Promise.race([ready, outcome.then(() => { throw Error('Writer ended before reservation hold'); })]);
          await api(admin).deleteAllProgressPhotos(id);
        } finally { release(); await outcome; }
        const result = await outcome;
        assert.match(result.error?.message ?? '', /photo_owner_deleting/);
        assert.equal(httpCalls, 0);
        assert.equal((await bucket.list(id)).data.length, 0);
        console.log(`PASS ${method}/cancel-before-dispatch: deletion completed, suspended caller refused, zero upload HTTP calls`);
      }
      // Hold the real HTTP write before dispatch, after the real DB admission.
      // Deletion must remain incomplete until that admitted writer has finished.
      for (const method of ['uploadAvatar', 'uploadProgressPhoto']) {
        const id = 'crash-test-' + crypto.randomUUID(); owners.push(id);
        let signalStarted, release;
        const started = new Promise(resolve => { signalStarted = resolve; });
        const held = new Promise(resolve => { release = resolve; });
        const delayed = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          ...options, global: { fetch: async (input, init) => {
            const target = new URL(typeof input === 'string' ? input : input.url);
            assert.equal(target.origin, 'http://127.0.0.1:54321');
            assert.equal(init.method, 'POST');
            assert(target.pathname.startsWith('/storage/v1/object/progress%20photos/'));
            signalStarted();
            await held;
            return fetch(input, init);
          } },
        });
        const writing = api(delayed)[method](id, { type: 'image/png', arrayBuffer: async () => png });
        // Observe an early rejection rather than waiting forever for dispatch.
        try {
          await Promise.race([started, writing.then(() => { throw Error('Write completed before release'); })]);
          await assert.rejects(api(admin).deleteAllProgressPhotos(id), /photo_writes_unresolved/);
          await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
          const before = await bucket.list(id);
          assert.equal(before.error, null); assert.equal(before.data.length, 0);
        } finally {
          release();
          // No writer may outlive fixture cleanup, even on assertion failure.
          const result = await writing;
          assert(result.path, 'The admitted late HTTP upload must actually finish');
        }
        const after = await bucket.list(id);
        assert.equal(after.error, null); assert.equal(after.data.length, 1);
        await api(admin).deleteAllProgressPhotos(id);
        const removed = await bucket.list(id);
        assert.equal(removed.error, null); assert.equal(removed.data.length, 0);
        await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
        console.log(`PASS ${method}/late-http-write: deletion refused during admitted upload, retry removed real late file, gate stayed closed`);
      }
      for (const method of ['uploadAvatar', 'uploadProgressPhoto']) {
        for (const mode of ['after-reservation', 'after-upload', 'before-upload', 'wrong-proof']) {
          const id = 'crash-test-' + crypto.randomUUID(); owners.push(id);
          const child = spawnSync(process.execPath, [__filename, '--writer', id, method, mode], {
            env: process.env, stdio: 'pipe', timeout: 20000,
          });
          assert.equal(child.status, mode === 'after-reservation' ? 75 : mode === 'before-upload' ? 74 : 73, child.stderr?.toString());
          let stored = await bucket.list(id); assert.equal(stored.error, null);
          assert.equal(stored.data.length, ['before-upload', 'after-reservation'].includes(mode) ? 0 : 1);
          if (mode === 'wrong-proof') {
            const filePath = `${id}/${stored.data[0].name}`;
            assert.equal((await bucket.upload(filePath, png, { upsert: true, contentType: 'image/png',
              metadata: { coaiUploadOperation: crypto.randomUUID() } })).error, null);
          }
          if (mode === 'after-upload' || mode === 'after-reservation') {
            await api(admin).deleteAllProgressPhotos(id);
            stored = await bucket.list(id); assert.equal(stored.data.length, 0);
          } else {
            await assert.rejects(api(admin).deleteAllProgressPhotos(id), /photo_writes_unresolved/);
          }
          await assert.rejects(registry.reservePhotoWrite(id), /photo_owner_deleting/);
          console.log(`PASS ${method}/${mode}: ${mode === 'after-reservation' ? 'new process cancelled never-dispatched reservation' : mode === 'after-upload' ? 'new process recovered exact proof and removed file' : 'no false completion without proof'}`);
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
