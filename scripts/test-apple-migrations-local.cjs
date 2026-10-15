// Replays this branch's migrations into a unique disposable database on the
// local Supabase QA cluster. Never accepts a remote host or a production DB.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const url = new URL(process.env.DATABASE_URL || 'http://missing.invalid');
assert.equal(url.protocol, 'postgresql:');
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.port, '54322');
assert.equal(url.pathname, '/postgres');
const name = `coai_apple_migration_${randomUUID().replaceAll('-', '')}`;
assert.match(name, /^coai_apple_migration_[a-f0-9]{32}$/);
const targetURL = new URL(url);
targetURL.pathname = `/${name}`;
const admin = new PrismaClient();
let created = false, database;
async function main() {
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    created = true;
    const migration = spawnSync(process.execPath, [
      'node_modules/prisma/build/index.js', 'migrate', 'deploy',
    ], { env: { ...process.env, DATABASE_URL: targetURL.href, DIRECT_URL: targetURL.href },
      encoding: 'utf8', timeout: 60000 });
    if (migration.status !== 0) {
      throw Error(`Migration failed: ${migration.stderr || migration.stdout || migration.error?.message}`);
    }
    database = new PrismaClient({ datasources: { db: { url: targetURL.href } } });
    for (const table of ['apple_purchase_accounts', 'apple_transactions']) {
      const [security] = await database.$queryRaw`
        SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname=${table}
      `;
      assert.equal(security?.relrowsecurity, true, `${table}: RLS enabled`);
      for (const role of ['anon', 'authenticated']) {
        const [grants] = await database.$queryRaw`
          SELECT has_table_privilege(${role}, ${`public.${table}`}, 'SELECT,INSERT,UPDATE,DELETE') AS allowed
        `;
        assert.equal(grants.allowed, false, `${role}: no Data API access to ${table}`);
      }
    }
    const id = randomUUID();
    const user = await database.user.create({ data: {
      id, supabaseAuthId: id, email: `apple-migration-${id}@example.test`,
      applePurchaseAccount: { create: {} },
    }, include: { applePurchaseAccount: true } });
    assert.match(user.applePurchaseAccount.accountToken, /^[a-f0-9-]{36}$/);
    const facts = { environment: 'Sandbox', transactionId: id, originalTransactionId: id,
      userId: id, productId: 'fr.coai.mobile.essentiel.monthly',
      purchasedAt: new Date(1000), expiresAt: new Date(10000), signedAt: new Date(2000) };
    await assert.rejects(database.appleTransaction.create({ data: { ...facts, environment: 'invalid' } }));
    await assert.rejects(database.appleTransaction.create({ data: { ...facts, expiresAt: new Date(1000) } }));
    await database.appleTransaction.create({ data: facts });
    assert.equal(await database.appleTransaction.count({ where: { userId: id } }), 1);
    await database.user.delete({ where: { id } });
    assert.equal(await database.applePurchaseAccount.count({ where: { userId: id } }), 0);
    assert.equal(await database.appleTransaction.count({ where: { userId: id } }), 0);
    const failed = await database.$queryRaw`
      SELECT migration_name FROM public._prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL
    `;
    assert.equal(failed.length, 0);
    console.log('PASS: full migration chain on a fresh local QA database; Apple RLS/grants, UUID binding, constraints and deletion cascades verified. No Apple receipt or production migration.');
  } finally {
    await database?.$disconnect();
    if (created) await admin.$executeRawUnsafe(`DROP DATABASE "${name}"`);
    await admin.$disconnect();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
