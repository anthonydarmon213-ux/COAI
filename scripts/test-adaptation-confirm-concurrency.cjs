const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
// Only the disposable loopback database. Never read production environment.
const clients = [0, 1].map(() => new PrismaClient({ datasources: { db: {
  url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
} } }));
const ids = [crypto.randomUUID(), crypto.randomUUID()];
const source = fs.readFileSync('src/lib/adaptation/engine.ts', 'utf8');
const ast = ts.createSourceFile('engine.ts', source, ts.ScriptTarget.Latest, true);
const names = ['confirmerAdaptation', 'rejeterAdaptation'];
const functions = names.map(name => {
  const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(fn, name); return fn.getText(ast);
}).join('\n');
let events = [], notifications = 0, calls = 0;
function engine(prisma, generate = async () => ({ fixture: 'adapted' })) {
  const box = { exports: {}, prisma, process: { env: {} },
    buildDirectiveTexte: () => 'fixture', buildProfilUtilisateur: () => ({}),
    genererPilier: async (...args) => { calls++; return generate(...args); },
    getEffectivePlan: () => 'PASS_IA',
    trackServerEvent: name => events.push(name),
    sendAdminNotification: async () => { notifications++; },
  };
  vm.runInNewContext(ts.transpileModule(functions, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, box);
  return box.exports;
}
function barrier(target) {
  let arrived = 0, release, ready;
  const blocked = new Promise(resolve => { release = resolve; });
  const entered = new Promise(resolve => { ready = resolve; });
  return { entered, release, generate: async () => {
    if (++arrived === target) ready();
    await blocked; return { fixture: 'adapted' };
  } };
}
(async () => {
  const db = clients[0], userId = ids[0], pilier = 'ENTRAINEMENT';
  try {
    for (const id of ids) await db.user.create({ data: { id, supabaseAuthId: id, email: `adaptation-${id}@example.test` } });
    const original = await db.programmeGenerated.create({ data: { userId, pilier, contenu: { fixture: 'original' }, statut: 'GENERE_IA', version: 1 } });
    const propose = () => db.programmeAdaptation.create({ data: { userId, pilier, decision: 'GARDER', changements: [], resume: 'fixture', statut: 'PROPOSEE', programmePrecedentId: original.id } });
    const first = await propose();
    const gate = barrier(4);
    const pending = [0, 1, 0, 1].map(i => engine(clients[i], gate.generate).confirmerAdaptation(userId, first.id));
    await gate.entered; gate.release();
    const results = await Promise.all(pending);
    assert.equal(results.filter(r => 'nouvelleVersion' in r).length, 1);
    assert.equal(results.find(r => 'nouvelleVersion' in r).nouvelleVersion, 2);
    assert.equal(events.filter(e => e === 'adaptation_accepted').length, 1);
    assert.equal(await db.programmeGenerated.count({ where: { userId } }), 2);
    const applied = await db.programmeAdaptation.findUnique({ where: { id: first.id } });
    assert.equal(applied.statut, 'APPLIQUEE'); assert.ok(applied.programmeSuivantId);
    const beforeRetry = calls;
    assert.ok((await engine(db).confirmerAdaptation(userId, first.id)).error);
    assert.equal(calls, beforeRetry);
    assert.ok((await engine(db).rejeterAdaptation(userId, first.id)).error);

    // A rejection while generation is waiting must win without publishing.
    const rejected = await propose(), rejectGate = barrier(1);
    const waiting = engine(db, rejectGate.generate).confirmerAdaptation(userId, rejected.id);
    await rejectGate.entered;
    const refusals = await Promise.all([0, 1].map(i => engine(clients[i]).rejeterAdaptation(userId, rejected.id)));
    assert.equal(refusals.filter(r => r.ok).length, 1);
    rejectGate.release(); assert.ok((await waiting).error);
    assert.equal(await db.programmeGenerated.count({ where: { userId } }), 2);
    assert.equal(events.filter(e => e === 'adaptation_rejected').length, 1);
    assert.equal((await db.programmeAdaptation.findUnique({ where: { id: rejected.id } })).statut, 'REJETEE');

    // All writes must roll back together, and no post-commit effects fire.
    const retry = await propose(), beforeEvents = events.length;
    const broken = { programmeAdaptation: db.programmeAdaptation, user: db.user,
      $transaction: work => db.$transaction(async tx => { await work(tx); throw Error('fixture rollback'); }),
    };
    await assert.rejects(engine(broken).confirmerAdaptation(userId, retry.id), /fixture rollback/);
    assert.equal(await db.programmeGenerated.count({ where: { userId } }), 2);
    const unchanged = await db.programmeAdaptation.findUnique({ where: { id: retry.id } });
    assert.equal(unchanged.statut, 'PROPOSEE'); assert.equal(unchanged.programmeSuivantId, null);
    assert.equal(events.length, beforeEvents);
    assert.equal((await engine(db).confirmerAdaptation(userId, retry.id)).nouvelleVersion, 3);

    // Independent adaptations share the version lock, rather than each using v4.
    const more = await Promise.all([propose(), propose()]), versionsGate = barrier(2);
    const parallel = more.map((a, i) => engine(clients[i], versionsGate.generate).confirmerAdaptation(userId, a.id));
    await versionsGate.entered; versionsGate.release();
    assert.deepEqual((await Promise.all(parallel)).map(r => r.nouvelleVersion).sort(), [4, 5]);
    assert.deepEqual((await db.programmeGenerated.findMany({ where: { userId }, orderBy: { version: 'asc' } })).map(p => p.version), [1, 2, 3, 4, 5]);

    const privateProposal = await propose(), beforeOwner = calls;
    assert.ok((await engine(db).confirmerAdaptation(ids[1], privateProposal.id)).error);
    assert.ok((await engine(db).rejeterAdaptation(ids[1], privateProposal.id)).error);
    assert.equal(calls, beforeOwner);
    assert.equal(notifications, 0);
    console.log('PASS actual engine/local PostgreSQL: concurrent confirmations, reject during generation, atomic rollback, version sequence, owner checks, effects only after commit');
    console.log('LIMIT: provider mocked; concurrent calls may still generate multiple paid responses before the transaction. No production writes or emails.');
  } finally {
    for (const id of ids) await db.user.deleteMany({ where: { id, email: `adaptation-${id}@example.test` } });
    await Promise.all(clients.map(db => db.$disconnect()));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
