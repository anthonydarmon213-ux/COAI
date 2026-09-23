// Local integration test. Retains one new fictitious application-only fixture
// per run so the first-insert race is exercised, without deleting any account.
// No Auth signup, email, purchase, entitlement or production access occurs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const url = new URL(process.env.DATABASE_URL || 'http://missing.invalid');
assert(['127.0.0.1', 'localhost'].includes(url.hostname) && url.port === '54322', 'Local QA database only');
const database = new PrismaClient();
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/subscription/apple-account.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsObject, require: name => {
  assert.equal(name, '@/lib/db/client'); return { prisma: database };
} });
const getToken = exportsObject.getOrCreateAppleAccountToken;
async function main() {
  const qaUser = await database.user.findUnique({ where: { email: 'coai-qa-20260923-1015@example.test' }, select: { id: true } });
  assert(qaUser, 'Existing fictitious QA account required');
  const before = JSON.stringify(await database.subscription.findMany({ orderBy: { id: 'asc' } }));
  const fixtureID = randomUUID();
  const user = await database.user.create({ data: { id: fixtureID, supabaseAuthId: fixtureID, email: `apple-binding-${fixtureID}@example.test` }, select: { id: true } });
  await assert.rejects(getToken(''), /APPLE_USER_REQUIRED/);
  const tokens = await Promise.all(Array.from({ length: 20 }, () => getToken(user.id)));
  assert.equal(new Set(tokens).size, 1, 'Concurrent requests must retain one token');
  assert.notEqual(await getToken(qaUser.id), tokens[0], 'Distinct accounts must not share a token');
  assert.match(tokens[0], /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  const reconnected = new PrismaClient();
  try { assert.equal(await getToken(user.id, reconnected), tokens[0], 'Token survives a new database connection'); }
  finally { await reconnected.$disconnect(); }
  assert.equal(await database.applePurchaseAccount.count({ where: { userId: user.id } }), 1);
  const [table] = await database.$queryRaw`SELECT relrowsecurity FROM pg_class WHERE oid = 'public.apple_purchase_accounts'::regclass`;
  assert.equal(table.relrowsecurity, true);
  for (const role of ['anon', 'authenticated']) {
    const [grants] = await database.$queryRaw`SELECT has_table_privilege(${role}, 'public.apple_purchase_accounts', 'SELECT,INSERT,UPDATE,DELETE') AS allowed`;
    assert.equal(grants.allowed, false, role);
    // Fixed SQL only. WHERE false prevents a mutation even if protection fails.
    for (const statement of [
      'SELECT * FROM public.apple_purchase_accounts',
      'INSERT INTO public.apple_purchase_accounts ("userId") SELECT id FROM public.users WHERE false',
      'UPDATE public.apple_purchase_accounts SET "accountToken" = gen_random_uuid() WHERE false',
      'DELETE FROM public.apple_purchase_accounts WHERE false',
    ]) {
      await assert.rejects(database.$transaction(async tx => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
        await tx.$queryRawUnsafe(statement);
      }), error => error.code === 'P2010' && error.meta?.code === '42501', `${role} cannot access account bindings`);
    }
  }
  assert.equal(JSON.stringify(await database.subscription.findMany({ orderBy: { id: 'asc' } })), before, 'Stripe subscriptions unchanged');
  console.log('PASS: 20 concurrent requests, stable persisted token, RLS enabled, 8 client operations denied, Stripe unchanged');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => database.$disconnect());
