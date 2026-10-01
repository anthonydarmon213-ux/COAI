// Disposable loopback Auth/PostgreSQL/Storage integration; no production calls.
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const database = new URL(process.env.DATABASE_URL);
assert.equal(database.hostname, '127.0.0.1'); assert.equal(database.port, '54322');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const db = new PrismaClient();
const bucket = admin.storage.from('progress photos');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
let identity, user, session;
const endpoint = 'http://127.0.0.1:3050/api/profil/avatar';
async function main() {
  const email = `avatar-http-${randomUUID()}@example.test`, password = randomUUID() + 'Aa1!';
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null); identity = created.data.user;
  user = await db.user.create({ data: { email, supabaseAuthId: identity.id } });
  const login = await auth.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null); session = login.data.session;
  const headers = { Authorization: `Bearer ${session.access_token}` };
  const form = () => { const value = new FormData(); value.set('file', new Blob([png], { type: 'image/png' }), 'avatar.png'); return value; };
  assert.equal((await fetch(endpoint, { method: 'POST', body: form() })).status, 401);
  const valid = await fetch(endpoint, { method: 'POST', headers, body: form() });
  const result = await valid.json(); assert.equal(valid.status, 201, JSON.stringify(result));
  const signedURL = new URL(result.url);
  assert(['localhost', '127.0.0.1'].includes(signedURL.hostname));
  assert.equal(signedURL.port, '54321'); assert.equal(signedURL.protocol, 'http:');
  assert.deepEqual(Buffer.from(await (await fetch(result.url)).arrayBuffer()), png);
  const expectedPath = (await db.user.findUnique({ where: { id: user.id } })).avatarPath;
  assert.ok(expectedPath.startsWith(`${identity.id}/`));
  assert.match(expectedPath.slice(identity.id.length + 1), /^[0-9a-f-]{36}\.png$/);
  const malformed = await fetch(endpoint, { method: 'POST', headers: { ...headers, 'Content-Type': 'multipart/form-data; boundary=missing' }, body: 'truncated' });
  assert.equal(malformed.status, 400); assert.match((await malformed.json()).error, /Envoi incomplet/);
  const empty = new FormData(); empty.set('file', new Blob([], { type: 'image/png' }), 'empty.png');
  const rejected = await fetch(endpoint, { method: 'POST', headers, body: empty });
  assert.equal(rejected.status, 400); assert.match((await rejected.json()).error, /vide/);
  assert.equal((await db.user.findUnique({ where: { id: user.id } })).avatarPath, expectedPath);
  const stored = await bucket.download(expectedPath); assert.equal(stored.error, null);
  assert.deepEqual(Buffer.from(await stored.data.arrayBuffer()), png);
  const retry = await fetch(endpoint, { method: 'POST', headers, body: form() });
  assert.equal(retry.status, 201); assert((await retry.json()).url);
  const replacement = (await db.user.findUnique({ where: { id: user.id } })).avatarPath;
  assert.notEqual(replacement, expectedPath);
  assert((await bucket.download(expectedPath)).error, 'Replaced avatar must be removed after the new path is committed');
  assert.equal((await bucket.download(replacement)).error, null, 'Current avatar must remain available');
  const remaining = await bucket.list(identity.id); assert.equal(remaining.error, null);
  assert.deepEqual(remaining.data.map(file => file.name), [replacement.split('/')[1]]);
  const key = createHash('sha256').update('coai-photo-owner-v1:' + identity.id).digest('hex');
  const pending = await db.$queryRaw`SELECT id FROM photo_uploads WHERE "ownerKey"=${key} AND "retiredAvatarName" IS NOT NULL`;
  assert.equal(pending.length, 0);
  console.log('PASS real local avatar HTTP: authenticated upload, persisted exact image, malformed/empty rejection preserves current avatar, replacement deletes predecessor and clears durable cleanup task');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  try {
    if (session) assert.equal((await auth.auth.signOut({ scope: 'global' })).error, null);
    if (identity) {
      const listed = await bucket.list(identity.id); assert.equal(listed.error, null);
      const paths = listed.data.map(file => `${identity.id}/${file.name}`);
      if (paths.length) assert.equal((await bucket.remove(paths)).error, null);
      assert.equal((await bucket.list(identity.id)).data.length, 0);
      const key = createHash('sha256').update('coai-photo-owner-v1:' + identity.id).digest('hex');
      await db.$executeRaw`DELETE FROM photo_uploads WHERE "ownerKey"=${key}`;
      await db.$executeRaw`DELETE FROM photo_owner_gates WHERE "ownerKey"=${key}`;
    }
    if (user) await db.user.deleteMany({ where: { id: user.id } });
    if (identity) assert.equal((await admin.auth.admin.deleteUser(identity.id)).error, null);
    console.log('Disposable local avatar and account removed');
  } catch (error) { console.error('Cleanup failed', error); process.exitCode = 1; }
  await db.$disconnect();
});
