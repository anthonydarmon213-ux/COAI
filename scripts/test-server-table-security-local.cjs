// Real local Postgres/Auth/PostgREST. Only disposable fixture data; no remote URL.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const database = new URL(process.env.DATABASE_URL);
assert.equal(database.hostname, '127.0.0.1');
assert.equal(database.port, '54322');
const db = new PrismaClient();
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const member = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const tables = ['_prisma_migrations', 'activite_journaliere', 'avis', 'diagnostic_leads',
  'founder_waitlist_entries', 'mesures', 'profiles', 'programme_adaptations',
  'programmes_generated', 'repas_log', 'seances_log', 'subscriptions', 'tests_maxi',
  'users', 'videos', 'weekly_checkins', 'whatsapp_events'];
tables.push('ai_usage_events', 'billing_events', 'churn_feedback', 'coach_notes',
  'daily_sessions', 'recuperations_musculaires', 'stripe_webhook_events');
let authId, profileId;
(async () => {
  try {
    const email = `security-local-${randomUUID()}@example.test`, password = randomUUID() + 'Aa1!';
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.equal(created.error, null); authId = created.data.user.id;
    const user = await db.user.create({ data: { email, supabaseAuthId: authId } });
    profileId = user.id;
    const signed = await member.auth.signInWithPassword({ email, password });
    assert.equal(signed.error, null);
    for (const [role, client] of [['anon', anon], ['authenticated', member]]) {
      for (const table of tables) {
        // HEAD only: never retrieve unrelated rows, even when reproducing exposure.
        const result = await client.from(table).select('*', { head: true }).limit(0);
        assert([401, 403].includes(result.status), `${role}/${table}: direct read must be denied (got ${result.status})`);
        for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
          const [row] = await db.$queryRaw`SELECT has_table_privilege(${role}, ${'public.' + table}, ${privilege}) AS allowed`;
          assert.equal(row.allowed, false, `${role}/${table}/${privilege}`);
        }
        const [columns] = await db.$queryRaw`SELECT has_any_column_privilege(${role}, ${'public.' + table}, 'SELECT,INSERT,UPDATE,REFERENCES') AS allowed`;
        assert.equal(columns.allowed, false, `${role}/${table}: no column grant may bypass the table revocation`);
      }
      const attempts = [
        () => client.from('users').select('id').eq('id', user.id),
        () => client.from('users').update({ prenom: 'Forbidden fixture edit' }).eq('id', user.id),
        () => client.from('users').delete().eq('id', user.id),
        // A duplicate fixture ID cannot create stray data if privileges regress.
        () => client.from('users').insert({ id: user.id, email }),
      ];
      for (const attempt of attempts) {
        const result = await attempt();
        assert.equal(result.error?.code, '42501', `${role}: CRUD must reject on privileges`);
      }
    }
    for (const table of tables) {
      const [row] = await db.$queryRaw`SELECT relrowsecurity FROM pg_class WHERE oid=${'public.' + table}::regclass`;
      assert.equal(row.relrowsecurity, true, table);
    }
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).prenom, user.prenom);
    const response = await fetch('http://127.0.0.1:3050/api/compte/export', {
      headers: { Authorization: `Bearer ${signed.data.session.access_token}` },
    });
    assert.equal(response.status, 200, 'Authenticated server route must remain usable through Prisma');
    console.log(`PASS ${tables.length} server tables: anonymous/member HTTP reads denied, all table privileges revoked, RLS enabled; users CRUD denied, server export remains usable`);
  } finally {
    if (profileId) await db.user.deleteMany({ where: { id: profileId } });
    if (authId) {
      const removed = await admin.auth.admin.deleteUser(authId);
      assert.equal(removed.error, null);
    }
    await db.$disconnect();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
