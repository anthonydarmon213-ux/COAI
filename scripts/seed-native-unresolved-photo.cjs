// Only the disposable native UI fixture in the dedicated loopback database.
const assert = require('node:assert/strict');
const { createHash, randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const target = new URL(process.env.DATABASE_URL);
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.port, '54322');
assert.equal(target.pathname, '/postgres');
const mode = process.argv[2];
assert(['--seed', '--verify'].includes(mode));
const db = new PrismaClient();
(async () => {
  const user = await db.user.findUniqueOrThrow({ where: { email: 'coai-ui-20260924-http@example.test' } });
  assert(user.supabaseAuthId);
  const ownerKey = createHash('sha256').update('coai-photo-owner-v1:' + user.supabaseAuthId).digest('hex');
  if (mode === '--seed') {
    // No Storage request is sent: represents a process killed after reservation.
    await db.$transaction(async tx => {
      assert.equal(await tx.photoOwnerGate.count({ where: { ownerKey } }), 0);
      await tx.photoOwnerGate.create({ data: { ownerKey } });
      await tx.photoUpload.create({ data: { id: randomUUID(), ownerKey } });
    });
    console.log('READY local native fixture: one admitted upload, no file dispatched.');
  } else {
    const gate = await db.photoOwnerGate.findUniqueOrThrow({ where: { ownerKey } });
    assert.equal(gate.closed, true);
    const operations = await db.photoUpload.findMany({ where: { ownerKey } });
    assert.equal(operations.length, 1);
    assert.equal(operations[0].settled, false);
    assert.equal(await db.profile.count({ where: { userId: user.id } }), 1);
    console.log('PASS native deletion failure: profile preserved, gate closed, uncertain write not falsely settled.');
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
