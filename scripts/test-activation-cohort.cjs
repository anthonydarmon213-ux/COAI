const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../src/lib/admin/activation-cohort.ts'), 'utf8');
function load(prisma) {
  const box = { exports: {}, require: name => { assert.equal(name, '@/lib/db/client'); return { prisma }; } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, box);
  return box.exports.getActivationCohort;
}
async function main() {
  const queries = [];
  const now = new Date('2026-09-10T12:00:00Z');
  const result = await load({ user: { count: async query => { queries.push(query); return queries.length; } } })(now);
  assert.equal(JSON.stringify(result), JSON.stringify({ accounts: 1, programmes: 2, workouts: 3, repcount: 4, checkins: 5 }));
  for (const { where } of queries) {
    assert.equal(where.createdAt.gte.toISOString(), '2026-08-11T12:00:00.000Z');
    assert.equal(where.createdAt.lte.toISOString(), now.toISOString());
  }
  assert.equal(queries[2].where.seances.some.source, 'PROGRAMME');
  assert.equal(queries[3].where.seances.some.source, 'REPCOUNT');
  assert.equal(queries[4].where.seances.some.OR.length, 3);
  assert.equal(JSON.stringify(queries[1].where.programmes.some.statut.in), '["VALIDE","GENERE_IA"]');
  await assert.rejects(load({ user: { count: async () => { throw Error('database unavailable'); } } })(), /database unavailable/, 'Never replace unavailable data with zero');
  console.log('PASS cohort: same window, member counts, sources separate, check-in optional, DB failures visible');
  if (process.argv.includes('--local')) {
    // Isolated fixtures, hard-coded loopback datasource; never reads production.
    const { PrismaClient } = require('@prisma/client');
    const id = require('node:crypto').randomUUID();
    const email = `cohort-${id}@example.test`;
    const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' } } });
    try {
      const clock = new Date('2042-06-15T12:00:00Z');
      const createdAt = new Date('2042-06-14T12:00:00Z');
      const baseline = await load(prisma)(clock);
      await prisma.user.create({ data: { id, supabaseAuthId: id, email, createdAt } });
      const programme = await prisma.programmeGenerated.create({ data: {
        userId: id, pilier: 'ENTRAINEMENT', statut: 'EN_ATTENTE', contenu: { fixture: true }, generatedAt: createdAt,
      } });
      const pending = await load(prisma)(clock);
      assert.equal(pending.accounts, baseline.accounts + 1);
      assert.equal(pending.programmes, baseline.programmes, 'Pending is not an accessible programme');
      await prisma.programmeGenerated.update({ where: { id: programme.id }, data: { statut: 'VALIDE' } });
      await prisma.seanceLog.createMany({ data: [
        { userId: id, source: 'PROGRAMME', exercices: [], date: createdAt, createdAt, difficulte: 3 },
        { userId: id, source: 'PROGRAMME', exercices: [], date: createdAt, createdAt },
        { userId: id, source: 'REPCOUNT', exercices: [], date: createdAt, createdAt },
      ] });
      const snapshot = await load(prisma)(clock);
      for (const field of ['accounts', 'programmes', 'workouts', 'repcount', 'checkins']) {
        assert.equal(snapshot[field], baseline[field] + 1, `${field} counts members, not rows`);
      }
      console.log('PASS local PostgreSQL: isolated member, pending excluded, two workouts count once, RepCount/check-in counted independently');
    } finally {
      await prisma.user.deleteMany({ where: { id, email } });
      await prisma.$disconnect();
    }
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
