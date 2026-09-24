// Exercise the actual summary calculation without network or database calls.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const start = source.indexOf('    type SetDetail =');
const end = source.indexOf('    const listeBilan:', start);
assert.ok(start > 0 && end > start);
const code = ts.transpileModule(source.slice(start, end) + '\nglobalThis.result = [...parExercice.values()];', {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const set = (i, nom) => ({ type: 'set', exerciceIndex: i, setIndex: 1, nom });
const all = [set(0, 'A'), set(1, 'B'), set(2, 'C'), set(3, 'D')];
function summary(steps, index, nomsRealises, realise) {
  const context = { steps, tousLesSteps: all, index, step: steps[index], nomsRealises, realise, substitutions: {} };
  vm.runInNewContext(code, context);
  return JSON.parse(JSON.stringify(context.result));
}
const recorded = { '0-1': 'A', '1-1': 'B', '2-1': 'C' };
const values = { '0-1': { reps: '10', charge: '20' }, '1-1': { reps: '8', charge: '30' }, '2-1': { reps: '6', charge: '40' } };
const condensed = [all[0], all[1], all[3]];
const result = summary(condensed, 0, recorded, values);
assert.deepEqual(result.map(e => e.nom), ['A', 'B', 'C'], 'Switching mode must not lose already validated sets');
assert.equal(result[2].sets[0].charge, 40);
assert.deepEqual(summary(all, 1, { '0-1': 'A' }, values).map(e => e.nom), ['A', 'B'], 'Current set is included, future sets are not');
assert.deepEqual(summary([{ type: 'echauffement' }], 0, {}, {}).map(e => e.nom), []);
console.log('PASS: completed sets survive mode changes; current set counted once, unperformed sets excluded.');
