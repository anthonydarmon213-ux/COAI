const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const target = new URL(process.env.DATABASE_URL);
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.port, '54322');
assert.equal(target.pathname, '/postgres');
const db = new PrismaClient();
(async () => {
  const user = await db.user.findUniqueOrThrow({where:{email:'coai-ui-20260924-http@example.test'}});
  const exercises = [
    {nom:'Gainage planche',series:1,sets:[{reps:0,charge:0,dureeSecondes:45}]},
    {nom:'Squat barre',series:1,sets:[{reps:10,charge:20}]},
  ];
  if (process.argv.includes('--malformed')) {
    exercises.push(null, {nom:42}, {nom:'Anciennes séries',sets:[null,{reps:-5,charge:20}]});
  }
  if (process.argv.includes('--prepare')) {
    assert.equal(await db.seanceLog.count({where:{userId:user.id}}), 0);
    await db.seanceLog.create({data:{userId:user.id,date:new Date(),source:'PROGRAMME',notes:'Journal natif fictif',exercices:exercises}});
    console.log('Prepared isolated local journal fixture: 45-second hold and 10 × 20 kg set.');
  } else {
    const logs = await db.seanceLog.findMany({where:{userId:user.id}});
    assert.equal(logs.length, 1);
    assert.deepEqual(logs[0].exercices, exercises);
    console.log('PASS journal fixture unchanged by native display; one workout, exact timed and dynamic metrics.');
  }
})().catch(e => {console.error(e.message);process.exitCode=1;}).finally(()=>db.$disconnect());
