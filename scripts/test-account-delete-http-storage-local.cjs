// Real local HTTP/Auth/Postgres/Storage only. No Stripe, Apple or production calls.
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const database = new URL(process.env.DATABASE_URL);
assert.equal(database.hostname, '127.0.0.1');
assert.equal(database.port, '54322');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const client = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const db = new PrismaClient();
const fixtures = [];
const bucket = admin.storage.from('progress photos');
let png;
async function fixture(count) {
  const email = `delete-http-${randomUUID()}@example.test`, password = randomUUID() + 'Aa1!';
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null);
  const f = { id: created.data.user.id, email, password, paths: [], sessions: [] };
  fixtures.push(f);
  f.user = await db.user.create({ data: { email, supabaseAuthId: f.id, profile: { create: { objectifs: 'Fixture locale suppression' } } } });
  for (let i = 0; i < 2; i++) {
    const signed = await client().auth.signInWithPassword({ email, password });
    assert.equal(signed.error, null);
    f.sessions.push(signed.data.session);
  }
  for (let i = 0; i < count; i++) {
    const path = `${f.id}/fixture-${i}.png`;
    f.paths.push(path);
    const upload = await bucket.upload(path, png, { contentType: 'image/png' });
    assert.equal(upload.error, null);
  }
  return f;
}
const headers = f => ({ Authorization: `Bearer ${f.sessions[0].access_token}` });
const exportAccount = f => fetch('http://127.0.0.1:3050/api/compte/export', { headers: headers(f) });
async function main() {
  png = await require('sharp')({ create: { width: 16, height: 16, channels: 3, background: '#abcdef' } }).png().toBuffer();
  const buckets = await admin.storage.listBuckets();
  assert.equal(buckets.error, null);
  const existing = buckets.data.find(b => b.name === 'progress photos');
  if (!existing) {
    const created = await admin.storage.createBucket('progress photos', { public: false });
    assert.equal(created.error, null);
  } else assert.equal(existing.public, false);
  if (process.argv.includes('--concurrent')) {
    const concurrent = await fixture(2);
    const results = await Promise.all(concurrent.sessions.map(async session => {
      const response = await fetch('http://127.0.0.1:3050/api/compte/delete', {
        method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'x-coai-delete-confirmation': '1' },
      });
      return { status: response.status, body: await response.json() };
    }));
    console.log('Concurrent deletion responses', JSON.stringify(results));
    assert(results.some(result => result.status === 200 && result.body.success === true));
    assert(results.every(result => result.status === 200 || result.status === 401),
      'A second request must not report a service failure after successful concurrent deletion');
    assert.equal(await db.user.count({ where: { id: concurrent.user.id } }), 0);
    assert.equal((await admin.auth.admin.getUserById(concurrent.id)).error?.code, 'user_not_found');
    assert.deepEqual((await bucket.list(concurrent.id)).data, []);
    console.log('PASS concurrent local deletion: no false service failure, profile/Auth/photos absent');
    return;
  }
  const a = await fixture(100), b = await fixture(1);
  // Replace an avatar through the real route. Only its final version should
  // remain, plus 100 synthetic objects to retain the pagination boundary.
  for (let index = 0; index < 2; index++) {
    const form = new FormData();
    form.set('file', new Blob([png], { type: 'image/png' }), 'avatar.png');
    const upload = await fetch('http://127.0.0.1:3050/api/profil/avatar', {
      method: 'POST', headers: headers(a), body: form,
    });
    assert.equal(upload.status, 201);
    const stored = (await db.user.findUniqueOrThrow({ where: { id: a.user.id } })).avatarPath;
    assert.ok(stored.startsWith(`${a.id}/`));
    assert.match(stored.slice(a.id.length + 1), /^[0-9a-f-]{36}\.png$/);
    assert.ok(!a.paths.includes(stored), 'Replacement must not overwrite an earlier avatar');
    a.paths.push(stored);
  }
  assert((await bucket.download(a.paths[a.paths.length - 2])).error, 'Predecessor removed by replacement');
  assert.equal((await exportAccount(a)).status, 200);
  assert.equal((await exportAccount(b)).status, 200);
  const before = await bucket.list(a.id, { limit: 200 });
  assert.equal(before.error, null);
  assert.equal(before.data.length, 101);
  const signedPhoto = await bucket.createSignedUrl(a.paths[0], 3600);
  assert.equal(signedPhoto.error, null);
  assert.equal((await fetch(signedPhoto.data.signedUrl)).status, 200);
  // Model an admitted write whose process has not yet stored its file. Never
  // settle it based on age/absence: the HTTP route must report the precise gate.
  const ownerKey = createHash('sha256').update('coai-photo-owner-v1:' + a.id).digest('hex');
  const operation = randomUUID();
  await db.$executeRaw`INSERT INTO photo_uploads (id, "ownerKey") VALUES (${operation}, ${ownerKey})`;
  const blocked = await fetch('http://127.0.0.1:3050/api/compte/delete', {
    method: 'POST', headers: { ...headers(a), 'x-coai-delete-confirmation': '1' },
  });
  assert.equal(blocked.status, 503);
  const blockedBody = await blocked.json();
  assert.equal(blockedBody.code, 'PHOTO_DELETION_UNCONFIRMED');
  assert.equal(blockedBody.success, undefined);
  assert.ok(!JSON.stringify(blockedBody).includes(operation));
  assert.equal(await db.user.count({ where: { id: a.user.id } }), 1);
  assert.equal((await admin.auth.admin.getUserById(a.id)).data.user.id, a.id);
  assert.equal((await bucket.list(a.id, { limit: 200 })).data.length, 101);
  assert.equal((await db.$queryRaw`SELECT closed FROM photo_owner_gates WHERE "ownerKey"=${ownerKey}`)[0].closed, true);
  // Let the admitted operation actually finish, with its exact recovery proof.
  // The normal delete route must recover it, not a test-side settled update.
  const latePath = `${a.id}/${operation}.png`;
  a.paths.push(latePath);
  assert.equal((await bucket.upload(latePath, png, {
    contentType: 'image/png', upsert: false, metadata: { coaiUploadOperation: operation },
  })).error, null);
  const response = await fetch('http://127.0.0.1:3050/api/compte/delete', {
    method: 'POST',
    headers: { ...headers(a), 'x-coai-delete-confirmation': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: b.user.id }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.deepEqual(body, { success: true });
  const after = await bucket.list(a.id, { limit: 200 });
  assert.equal(after.error, null);
  assert.deepEqual(after.data, []);
  assert.equal(await db.user.count({ where: { id: a.user.id } }), 0);
  assert.equal(await db.profile.count({ where: { userId: a.user.id } }), 0);
  for (const session of a.sessions) {
    const lookup = await client().auth.getUser(session.access_token);
    assert.equal(lookup.data.user, null);
    assert(lookup.error);
    const refresh = await client().auth.refreshSession({ refresh_token: session.refresh_token });
    assert.equal(refresh.data.session, null);
    assert(refresh.error);
    const denied = await fetch('http://127.0.0.1:3050/api/compte/export', { headers: { Authorization: `Bearer ${session.access_token}` } });
    assert.equal(denied.status, 401);
    for (const endpoint of ['/api/profil/avatar', '/api/mesures/photo']) {
      const form = new FormData();
      form.set('file', new Blob([png], { type: 'image/png' }), 'deleted-account.png');
      const upload = await fetch('http://127.0.0.1:3050' + endpoint, {
        method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form,
      });
      assert.equal(upload.status, 401, `${endpoint} must reject a deleted account`);
    }
  }
  const removedPhoto = await fetch(signedPhoto.data.signedUrl, { cache: 'no-store' });
  assert([400, 404].includes(removedPhoto.status), 'A service outage is not proof of deletion');
  const removedPhotoError = await removedPhoto.json();
  assert.match(removedPhotoError.message, /object not found/i);
  const noRecreatedPhotos = await bucket.list(a.id, { limit: 200 });
  assert.equal(noRecreatedPhotos.error, null);
  assert.deepEqual(noRecreatedPhotos.data, []);
  assert((await client().auth.signInWithPassword({ email: a.email, password: a.password })).error);
  assert.equal((await exportAccount(b)).status, 200);
  assert.equal(await db.user.count({ where: { id: b.user.id } }), 1);
  const preserved = await bucket.download(b.paths[0]);
  assert.equal(preserved.error, null);
  assert.deepEqual(Buffer.from(await preserved.data.arrayBuffer()), png);
  console.log('PASS real local HTTP deletion: unresolved write returns specific 503 without deleting profile/Auth/photos; late exact proof recovered on retry, 102 files removed across pagination, both old sessions/password denied; forged owner ignored, other account preserved');
  console.log('PASS old sessions cannot upload avatars/progress photos; previous signed photo URL no longer serves the removed object; no photos recreated');
  console.log('LIMIT: local services only; no native UI, production, paid subscriptions or Apple cancellation verified');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  const errors = [];
  for (const f of fixtures) {
    try {
      if (f.paths.length) assert.equal((await bucket.remove(f.paths)).error, null);
      if (f.user) await db.user.deleteMany({ where: { id: f.user.id } });
      const found = await admin.auth.admin.getUserById(f.id);
      if (found.data.user) assert.equal((await admin.auth.admin.deleteUser(f.id)).error, null);
      else assert.equal(found.error?.status, 404);
      const key = createHash('sha256').update('coai-photo-owner-v1:' + f.id).digest('hex');
      await db.$executeRaw`DELETE FROM photo_uploads WHERE "ownerKey"=${key}`;
      await db.$executeRaw`DELETE FROM photo_owner_gates WHERE "ownerKey"=${key}`;
    } catch (error) { errors.push(error); }
  }
  await db.$disconnect();
  if (errors.length) { console.error('Cleanup failed', errors); process.exitCode = 1; }
  else console.log('Temporary local accounts/files cleaned; shared bucket retained');
});
