const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const day = new Date(); day.setUTCHours(0, 0, 0, 0);
const yesterday = new Date(day.getTime() - 86400000);
let workouts = [{id: 'daily:completed', date: day}];
let activities = [{date: day, pas: 3000}, {date: yesterday, pas: 9000}];
const output = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/neat/signaux.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
}).outputText, {exports: output, require(name) {
  if (name === '@/lib/db/client') return {prisma: {activiteJournaliere: {findMany: async args => {
    assert.equal(args.where.userId, 'member'); return activities;
  }}}};
  if (name === '@/lib/suivi/workout-history') return {workoutHistory: async (id, options) => {
    assert.equal(id, 'member');
    assert(Math.abs(options.from.getTime() - (Date.now() - 28 * 86400000)) < 2000);
    return workouts;
  }};
  throw Error(name);
}});
(async () => {
  const read = () => output.collecterSignauxNeat('member');
  let result = await read();
  assert.equal(result.moyennePasJoursEntrainement, 3000);
  assert.equal(result.moyennePasJoursSansEntrainement, 9000);
  assert.equal(result.moyenne28j, 6000);
  assert.equal(output.donneesSuffisantesNeat(result), false);
  workouts.push({id: 'manual', date: day});
  assert.equal((await read()).moyennePasJoursEntrainement, 3000);
  workouts = [];
  result = await read();
  assert.equal(result.moyennePasJoursEntrainement, null);
  assert.equal(result.moyennePasJoursSansEntrainement, 6000);
  activities = [{date: day, pas: null}];
  result = await read();
  assert.equal(result.moyenne28j, null);
  assert.equal(result.moyennePasJoursSansEntrainement, null);
  console.log('PASS activity: daily workout day classified, same-day sessions counted once for steps, missing steps remain unknown. Database/history mocked.');
})().catch(error => {console.error(error); process.exitCode = 1;});
