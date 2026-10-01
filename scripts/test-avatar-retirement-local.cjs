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
const claimChildMode = process.argv[2] === '--claim-child';
const id = childMode ? process.argv[3] : crypto.randomUUID(), foreign = crypto.randomUUID();
const key = crypto.createHash('sha256').update('coai-photo-owner-v1:' + id).digest('hex');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
let user;
const workerUsers = [];
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
async function workerScenarios() {
  const before = await prisma.$queryRaw`SELECT count(*)::int AS count FROM photo_uploads WHERE "retiredAvatarName" IS NOT NULL`;
  assert.equal(before[0].count, 0, 'Do not run a global cleanup test while other local tasks are pending');
  const owner = crypto.randomUUID();
  const ownerHash = crypto.createHash('sha256').update('coai-photo-owner-v1:' + owner).digest('hex');
  const profile = await prisma.user.create({ data: { email: `worker-${owner}@example.test`, supabaseAuthId: owner } });
  workerUsers.push({ owner, ownerHash, profile });
  let latest;
  async function replace() {
    const uploaded = await api().uploadAvatar(owner, new File([png], 'avatar.png', { type: 'image/png' }));
    assert(uploaded.path); latest = uploaded.path;
    await registry.commitAvatarPhoto(owner, profile.id, latest);
  }
  async function retryDue() {
    // Test clock advancement applies only to these already-retired fixture paths.
    await prisma.$executeRaw`UPDATE photo_uploads SET "retirementRetryAt"=NOW() - INTERVAL '1 minute'
      WHERE "ownerKey"=${ownerHash} AND "retiredAvatarName" IS NOT NULL`;
  }
  const httpMode = process.argv.includes('--worker-http');
  async function runBatch() {
    if (!httpMode) return api().purgeRetiredAvatarBatch();
    const response = await fetch('http://127.0.0.1:3050/api/cron/photos-retirees', {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
    return response.json();
  }
  if (httpMode) {
    for (const authorization of ['', 'Bearer wrong-local-secret']) {
      const response = await fetch('http://127.0.0.1:3050/api/cron/photos-retirees', { headers: { Authorization: authorization } });
      assert.equal(response.status, 401);
    }
  }
  for (let i = 0; i < 26; i++) await replace();
  const [a, b] = await Promise.all([registry.claimAvatarRetirements(), registry.claimAvatarRetirements()]);
  assert.equal(a.length + b.length, 25); assert(a.length <= 20 && b.length <= 20);
  assert.equal(new Set([...a, ...b].map(task => task.id)).size, 25, 'Concurrent claims must be disjoint');
  assert.equal((await runBatch()).attempted, 0, 'Claimed tasks wait before retry');
  assert.equal((await bucket.list(owner)).data.length, 26, 'A claim must not itself delete files');
  await retryDue();
  const abandoned = spawnSync(process.execPath, [__filename, '--claim-child'], { env: process.env, encoding: 'utf8', timeout: 20000 });
  assert.equal(abandoned.signal, 'SIGKILL', abandoned.stderr); assert.match(abandoned.stdout, /claimed:20/);
  const firstBatch = await runBatch(); assert.equal(firstBatch.attempted, 5); assert.equal(firstBatch.removed, 5);
  await retryDue(); await prisma.$disconnect();
  const secondBatch = await runBatch(); assert.equal(secondBatch.attempted, 20); assert.equal(secondBatch.removed, 20);
  assert.equal((await registry.pendingAvatarRetirements(owner)).length, 0);
  assert.deepEqual((await bucket.list(owner)).data.map(f => `${owner}/${f.name}`), [latest]);
  const routing = await prisma.$queryRaw`SELECT id FROM photo_uploads WHERE "ownerKey"=${ownerHash}
    AND ("retiredAvatarOwner" IS NOT NULL OR "retirementRetryAt" IS NOT NULL)`;
  assert.equal(routing.length, 0, 'Remove temporary owner-routing data after successful cleanup');
  console.log(`PASS ${httpMode ? 'HTTP' : 'module'} retirement worker: secret protection where applicable, disjoint claims, bounded 20+5 batches, abandoned claim retry, current avatar preserved, routing data cleared`);

  const unavailablePath = latest;
  for (let i = 0; i < 3; i++) await replace();
  const failing = api({ storage: { from: () => ({
    remove: async paths => paths.includes(unavailablePath) ? { error: { message: 'injected one-file outage' } } : bucket.remove(paths),
    list: (...args) => bucket.list(...args),
  }) } });
  const partial = await failing.purgeRetiredAvatarBatch();
  assert.equal(partial.attempted, 3); assert.equal(partial.removed, 2); assert.equal(partial.deferred, 1);
  assert.equal((await registry.pendingAvatarRetirements(owner)).length, 1);
  assert.equal((await runBatch()).attempted, 0);
  await retryDue();
  await prisma.$executeRaw`UPDATE photo_uploads SET "retiredAvatarOwner"=${foreign}
    WHERE "ownerKey"=${ownerHash} AND "retiredAvatarName" IS NOT NULL`;
  let storageCalls = 0;
  const forbidden = api({ storage: { from: () => ({ remove: async () => { storageCalls++; throw Error('must not run'); } }) } });
  assert.equal((await forbidden.purgeRetiredAvatarBatch()).deferred, 1);
  assert.equal(storageCalls, 0, 'Mismatched routing owner must never reach privileged Storage');
  await prisma.$executeRaw`UPDATE photo_uploads SET "retiredAvatarOwner"=${owner}
    WHERE "ownerKey"=${ownerHash} AND "retiredAvatarName" IS NOT NULL`;
  await retryDue();
  const unpublished = await api().uploadAvatar(owner, new File([png], 'pending.png', { type: 'image/png' }));
  assert.equal((await runBatch()).removed, 1);
  assert.equal((await bucket.download(latest)).error, null);
  assert.equal((await bucket.download(unpublished.path)).error, null);
  assert.equal((await registry.pendingAvatarRetirements(owner)).length, 0);
  console.log('PASS worker partial outage is isolated and retryable; forged owner refused before Storage; unpublished upload preserved');
  const previous = latest;
  await replace();
  const lostResponse = api({ storage: { from: () => ({
    remove: async paths => {
      assert.equal((await bucket.remove(paths)).error, null);
      return { error: { message: 'response lost after actual removal' } };
    },
  }) } });
  assert.equal((await lostResponse.purgeRetiredAvatarBatch()).deferred, 1);
  assert((await bucket.download(previous)).error);
  assert.equal((await registry.pendingAvatarRetirements(owner)).length, 1);
  await retryDue();
  assert.equal((await runBatch()).removed, 1);
  assert.equal((await registry.pendingAvatarRetirements(owner)).length, 0);
  assert.equal((await bucket.download(latest)).error, null);
  console.log('PASS worker lost response after actual removal: task retained, idempotent retry clears it without touching current avatar');
}
async function main() {
  if (process.argv.includes('--worker') || process.argv.includes('--worker-http')) return workerScenarios();
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
if (claimChildMode) {
  registry.claimAvatarRetirements().then(tasks => {
    fs.writeSync(1, `claimed:${tasks.length}\n`);
    process.kill(process.pid, 'SIGKILL');
  }).catch(error => { console.error(error); process.exit(1); });
} else if (childMode) {
  registry.commitAvatarPhoto(id, process.argv[4], process.argv[5]).then(() => {
    // Abrupt process death: no route cleanup, no shutdown handler.
    fs.writeSync(1, 'avatar_commit_persisted\n');
    process.kill(process.pid, 'SIGKILL');
  }).catch(error => { console.error(error); process.exit(1); });
} else main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  try {
    for (const fixture of workerUsers) {
      const files = await bucket.list(fixture.owner); assert.equal(files.error, null);
      if (files.data.length) assert.equal((await bucket.remove(files.data.map(f => `${fixture.owner}/${f.name}`))).error, null);
      await prisma.user.deleteMany({ where: { id: fixture.profile.id } });
      await prisma.$executeRaw`DELETE FROM photo_uploads WHERE "ownerKey"=${fixture.ownerHash}`;
      await prisma.$executeRaw`DELETE FROM photo_owner_gates WHERE "ownerKey"=${fixture.ownerHash}`;
    }
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
