// Independent verification and cleanup of the fixed, disposable local UI user.
const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const target = new URL(process.env.DATABASE_URL);
assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.port, '54322');
assert.equal(target.pathname, '/postgres');
const cleanup = process.argv.includes('--cleanup');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const client = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const db = new PrismaClient();
const email = 'coai-ui-20260924-http@example.test';
(async () => {
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  assert(user.supabaseAuthId);
  if (!cleanup) {
    const old = await client().auth.signInWithPassword({ email, password: 'Coai-local-UI-0924-only!' });
    assert(!old.data.session, 'Old test password must be rejected'); assert.equal(old.error?.code, 'invalid_credentials');
    const current = client();
    const signed = await current.auth.signInWithPassword({ email, password: 'Coai-recovered-local-1001!' });
    assert.equal(signed.error, null);
    assert.equal(signed.data.user.id, user.supabaseAuthId);
    assert.equal(await db.profile.count({ where: { userId: user.id } }), 1);
    assert.equal((await current.auth.signOut({ scope: 'global' })).error, null);
    console.log('PASS recovery: old password rejected, new password accepted for the same profile. Test sessions revoked.');
    return;
  }
  // This scenario never uploads a photo. Refuse to erase unexpected content.
  const photos = await admin.storage.from('progress photos').list(user.supabaseAuthId, { limit: 1 });
  assert.equal(photos.error, null); assert.equal(photos.data.length, 0);
  const ownerKey = require('node:crypto').createHash('sha256').update('coai-photo-owner-v1:' + user.supabaseAuthId).digest('hex');
  assert.equal(await db.photoUpload.count({ where: { ownerKey } }), 0);
  assert.equal(await db.photoOwnerGate.count({ where: { ownerKey } }), 0);
  await db.user.delete({ where: { id: user.id } });
  assert.equal((await admin.auth.admin.deleteUser(user.supabaseAuthId)).error, null);
  assert.equal((await admin.auth.admin.getUserById(user.supabaseAuthId)).error?.code, 'user_not_found');
  const inbox = await (await fetch('http://127.0.0.1:54324/api/v1/messages')).json();
  const messages = inbox.messages.filter(message => message.To.some(to => to.Address === email));
  if (messages.length) {
    const removed = await fetch('http://127.0.0.1:54324/api/v1/messages', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ IDs: messages.map(message => message.ID) }),
    });
    assert.equal(removed.status, 200);
  }
  const after = await (await fetch('http://127.0.0.1:54324/api/v1/messages')).json();
  assert.equal(after.messages.filter(message => message.To.some(to => to.Address === email)).length, 0);
  const rejected = await client().auth.signInWithPassword({ email, password: 'Coai-recovered-local-1001!' });
  assert(!rejected.data.session, 'Deleted test account must be rejected'); assert.equal(rejected.error?.code, 'invalid_credentials');
  console.log('PASS cleanup: only the recovery fixture and its local emails removed; password denied.');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
