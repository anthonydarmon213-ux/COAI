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
    // Read-only, hard-coded loopback datasource; never reads a production .env.
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' } } });
    try {
      const snapshot = await load(prisma)();
      const fixture = await prisma.user.findUnique({ where: { email: 'parcours-e2e-10sept@example.test' }, select: { seances: { select: { source: true, difficulte: true } } } });
      assert.ok(fixture, 'Fictitious local account is required');
      assert.ok(fixture.seances.filter(s => s.source === 'PROGRAMME').length >= 2);
      assert.equal(snapshot.workouts, 1, 'Two local programme logs must count as one member');
      assert.equal(snapshot.repcount, 1);
      assert.equal(snapshot.checkins, 1);
      console.log('PASS real local database:', JSON.stringify(snapshot));
    } finally { await prisma.$disconnect(); }
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
