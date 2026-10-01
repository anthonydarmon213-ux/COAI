// Disposable local account only. Never grant real subscription rights.
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const target = new URL(process.env.DATABASE_URL);
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.port, '54322');
assert.equal(target.pathname, '/postgres');
const db = new PrismaClient();
(async () => {
  const user = await db.user.findUniqueOrThrow({ where: { email: 'coai-ui-20260924-http@example.test' } });
  assert(user.programmeUnlockedAt, 'Synthetic access must already exist');
  if (process.argv.includes('--prepare')) {
    const programmes = await db.programmeGenerated.findMany({ where: { userId: user.id } });
    assert.equal(programmes.length, 1);
    assert.equal(programmes[0].contenu.titre, 'Fixture locale');
    assert.equal(await db.seanceLog.count({ where: { userId: user.id } }), 0);
    await db.$transaction(async tx => {
      await tx.dailySession.deleteMany({ where: { userId: user.id } });
      await tx.programmeGenerated.delete({ where: { id: programmes[0].id } });
      await tx.profile.update({ where: { userId: user.id }, data: {
        objectifs: 'Prendre du muscle', niveau: 'Débutant', frequenceEntrainement: '3 fois par semaine',
        equipementDisponible: 'Salle de sport complète', lieuEntrainement: 'Salle de sport',
        dureeSeanceMinutes: 45, age: 35, sexe: 'Homme', tailleCm: 178, poidsKg: 75,
        habitudesAlimentaires: 'Repas structurés et équilibrés', qualiteSommeil: 'Bonne (7-8h, plutôt réparateur)',
      } });
    });
    console.log('Local native fixture ready: eligible profile, synthetic access, zero programmes/workouts.');
    return;
  }
  const programmes = await db.programmeGenerated.findMany({ where: { userId: user.id } });
  assert.equal(programmes.length, 3, 'Exactly three pillars, no duplicated generation');
  assert.deepEqual(programmes.map(p => p.pilier).sort(), ['ENTRAINEMENT', 'NUTRITION', 'RECUPERATION']);
  for (const p of programmes) {
    assert.equal(p.statut, 'GENERE_IA');
    assert.equal(p.version, 1);
    assert.equal(p.contenu._source, 'SOCLE_COAI');
  }
  console.log('PASS native first programme: three catalogue pillars, version 1, no duplicate or invented human validation.');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
