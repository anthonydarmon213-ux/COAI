// Read-only independent proof for the disposable native UI fixture.
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const target = new URL(process.env.DATABASE_URL);
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.port, '54322');
assert.equal(target.pathname, '/postgres');
const db = new PrismaClient();
(async () => {
  const user = await db.user.findUniqueOrThrow({ where: { email: 'coai-ui-20260924-http@example.test' } });
  const workouts = await db.seanceLog.findMany({ where: { userId: user.id } });
  assert.equal(workouts.length, 1, 'The native flow must save exactly one workout');
  const workout = workouts[0];
  assert.equal(workout.source, 'REPCOUNT');
  assert.equal(workout.notes, 'Test local RepCount : deux mouvements');
  assert.equal(workout.exercices.length, 2);
  assert.deepEqual(workout.exercices.map(item => item.nom), ['Développé couché (barre)', 'Développé couché haltères']);
  assert.deepEqual(workout.exercices.map(item => item.sets.length), [2, 1]);
  for (const [exerciseIndex, item] of workout.exercices.entries()) {
    item.sets.forEach((set, index) => {
      assert.equal(set.set, index + 1);
      assert.equal(set.reps, 10);
      assert.equal(set.charge, exerciseIndex === 0 ? 20 : 12.5);
    });
  }
  console.log('PASS native RepCount: exactly one workout, two exercises, three exact sets and notes persisted.');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
