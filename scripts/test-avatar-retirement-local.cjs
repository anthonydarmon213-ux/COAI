// Actual application code, loopback PostgreSQL/Storage; no production access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const database = new URL(process.env.DATABASE_URL);
assert.equal(database.hostname, '127.0.0.1'); assert.equal(database.port, '54322');
const prisma = new PrismaClient();
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = client.storage.from('progress photos');
const childMode = process.argv[2] === '--commit-child';
const id = childMode ? process.argv[3] : crypto.randomUUID(), foreign = crypto.randomUUID();
const key = crypto.createHash('sha256').update('coai-photo-owner-v1:' + id).digest('hex');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
let user;
function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/storage/', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    assert(name in dependencies, name); return dependencies[name];
  } });
  return exports;
}
const registry = load('photo-write-registry.ts', { 'node:crypto': crypto, '@/lib/db/client': { prisma } });
const api = override => load('progress-photos.ts', {
  './photo-write-registry': registry,
  '@/lib/auth/admin': { createSupabaseAdminClient: () => override || client },
});
const upload = async () => {
  const result = await api().uploadAvatar(id, new File([png], 'avatar.png', { type: 'image/png' }));
  assert(result.path); return result.path;
};
const pending = () => registry.pendingAvatarRetirements(id);
const current = async () => (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).avatarPath;
async function main() {
  user = await prisma.user.create({ data: { email: `retirement-${id}@example.test`, supabaseAuthId: id } });
  assert.equal((await bucket.upload(`${foreign}/untouched.png`, png, { contentType: 'image/png' })).error, null);
  const legacy = `${id}/avatar.png`;
  assert.equal((await bucket.upload(legacy, png, { contentType: 'image/png' })).error, null);
  await prisma.user.update({ where: { id: user.id }, data: { avatarPath: legacy } });
  const first = await upload();
  await registry.commitAvatarPhoto(id, user.id, first);
  assert.equal((await pending())[0].name, 'avatar.png');
  await api().purgeRetiredAvatars(id);
  assert((await bucket.download(legacy)).error);
  assert.equal((await bucket.download(first)).error, null);
  const second = await upload();
  const child = spawnSync(process.execPath, [__filename, '--commit-child', id, user.id, second], {
    env: process.env, encoding: 'utf8', timeout: 20000,
  });
  assert.equal(child.signal, 'SIGKILL', child.stderr);
  assert.match(child.stdout, /avatar_commit_persisted/);
  assert.equal(await current(), second); assert.equal((await pending()).length, 1);
  // A new module/client connection recovers the committed retirement, without
  // any remembered in-process previous path.
  await prisma.$disconnect();
  const failed = api({ storage: { from: () => ({ remove: async () => ({ error: { message: 'injected outage' } }) }) } });
  await assert.rejects(failed.purgeRetiredAvatars(id), /avatar_retirement_failed/);
  assert.equal((await pending()).length, 1);
  assert.equal((await bucket.download(first)).error, null);
  await api().purgeRetiredAvatars(id);
  assert.equal((await pending()).length, 0);
  assert((await bucket.download(first)).error);
  assert.equal((await bucket.download(second)).error, null);
  await assert.rejects(registry.commitAvatarPhoto(id, user.id, first), /avatar_write_not_publishable/);
  assert.equal(await current(), second);
  console.log('PASS durable avatar retirement survives SIGKILL after commit, reconnect, storage outage and fresh module; removed avatar cannot be republished');

  const candidates = await Promise.all([upload(), upload(), upload()]);
  await Promise.all(candidates.map(p => registry.commitAvatarPhoto(id, user.id, p)));
  const winning = await current(); assert(candidates.includes(winning));
  const inFlight = await upload(); // Stored, but not published: must survive cleanup.
  await api().purgeRetiredAvatars(id);
  const files = await bucket.list(id); assert.equal(files.error, null);
  assert.deepEqual(files.data.map(f => `${id}/${f.name}`).sort(), [winning, inFlight].sort());
  await registry.commitAvatarPhoto(id, user.id, inFlight);
  assert.equal(await current(), inFlight);
  // Simulate remove success with no actual effect; keep the durable task.
  const lying = api({ storage: { from: () => ({ remove: async () => ({ error: null }), list: (...args) => bucket.list(...args) }) } });
  await assert.rejects(lying.purgeRetiredAvatars(id), /avatar_retirement_unconfirmed/);
  assert.equal((await pending()).length, 1);
  const truncated = api({ storage: { from: () => ({ remove: async () => ({ error: null }),
    list: async () => ({ error: null, data: Array.from({ length: 100 }, (_, i) => ({ name: `other-${i}` })) }),
  }) } });
  await assert.rejects(truncated.purgeRetiredAvatars(id), /avatar_retirement_unconfirmed/);
  assert.equal((await pending()).length, 1, 'A full partial listing cannot prove absence');
  await api().purgeRetiredAvatars(id);
  assert.equal((await pending()).length, 0);
  console.log('PASS simultaneous replacements, in-flight unpublished photo preserved, incomplete removal detected and retried');

  const unowned = await upload();
  await assert.rejects(registry.commitAvatarPhoto(id, 'missing-profile', unowned), /avatar_profile_missing/);
  await prisma.user.update({ where: { id: user.id }, data: { avatarPath: `${foreign}/avatar.png` } });
  await assert.rejects(registry.commitAvatarPhoto(id, user.id, unowned), /invalid_previous_avatar_path/);
  assert.equal(await current(), `${foreign}/avatar.png`, 'Bad previous path rolls back the whole publication');
  await prisma.user.update({ where: { id: user.id }, data: { avatarPath: inFlight } });
  await registry.commitAvatarPhoto(id, user.id, unowned); // Failed transaction did not consume publication.
  await assert.rejects(registry.commitAvatarPhoto(id, user.id, `${foreign}/avatar.png`), /invalid_avatar_path/);
  const unconfirmed = await registry.reservePhotoWrite(id);
  await assert.rejects(registry.commitAvatarPhoto(id, user.id, `${id}/${unconfirmed}.png`), /avatar_write_not_publishable/);
  // Fixture-only: this synthetic reservation never started an upload.
  await prisma.$executeRaw`DELETE FROM photo_uploads WHERE id=${unconfirmed} AND "ownerKey"=${key}`;
  await registry.closePhotoWrites(id);
  await assert.rejects(registry.commitAvatarPhoto(id, user.id, inFlight), /photo_owner_deleting/);
  await api().deleteAllProgressPhotos(id);
  assert.equal((await pending()).length, 0); assert.equal((await bucket.list(id)).data.length, 0);
  assert.equal((await bucket.download(`${foreign}/untouched.png`)).error, null);
  const rights = await prisma.$queryRaw`SELECT has_table_privilege('anon', 'public.photo_uploads', 'SELECT,INSERT,UPDATE,DELETE') AS anon,
    has_table_privilege('authenticated', 'public.photo_uploads', 'SELECT,INSERT,UPDATE,DELETE') AS member`;
  assert.equal(rights[0].anon, false); assert.equal(rights[0].member, false);
  console.log('PASS owner isolation, failed publication rollback, unconfirmed write rejected, account deletion clears tasks; private registry');
}
if (childMode) {
  registry.commitAvatarPhoto(id, process.argv[4], process.argv[5]).then(() => {
    // Abrupt process death: no route cleanup, no shutdown handler.
    fs.writeSync(1, 'avatar_commit_persisted\n');
    process.kill(process.pid, 'SIGKILL');
  }).catch(error => { console.error(error); process.exit(1); });
} else main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  try {
    for (const owner of [id, foreign]) {
      const files = await bucket.list(owner); assert.equal(files.error, null);
      if (files.data.length) assert.equal((await bucket.remove(files.data.map(f => `${owner}/${f.name}`))).error, null);
    }
    if (user) await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$executeRaw`DELETE FROM photo_uploads WHERE "ownerKey"=${key}`;
    await prisma.$executeRaw`DELETE FROM photo_owner_gates WHERE "ownerKey"=${key}`;
    console.log('Disposable local retirement profiles, files and registry rows cleaned');
  } catch (error) { console.error('Cleanup failed', error); process.exitCode = 1; }
  await prisma.$disconnect();
});
