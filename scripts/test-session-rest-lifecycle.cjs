// Actual initializer and transition source; clock/state setters simulated.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const initializer = source.match(/const \[repos, setRepos\] = useState<SeanceSauvegardee\["repos"\]>\(\(\) => \{([\s\S]*?)\n  \}\);/);
assert(initializer);
const transition = source.slice(source.indexOf('  function suivant() {'), source.indexOf('  // Garde double'));
assert(transition.includes('setIndex(nextIndex)'));
const steps = [{ type: 'echauffement' }, { type: 'repos', secondes: 90 }, { type: 'calme' }];
function initial(index, sauvegarde) {
  return vm.runInNewContext(`(() => {${initializer[1]}})()`, { steps, index, sauvegarde, Date: { now: () => 100000 } });
}
assert.equal(initial(0, { repos: { index: 1, fin: 99999 } }), undefined);
assert.equal(initial(1, null).fin, 190000);
assert.equal(initial(1, { repos: { index: 1, fin: 120000 } }).fin, 120000);
assert.equal(initial(1, { repos: { index: 1, fin: 90000 } }).fin, 90000, 'Expired rest is not restarted');
assert.equal(initial(1, { repos: { index: 9, fin: 999999 } }).fin, 190000);
for (const index of [0, 1]) {
  let rest, nextIndex;
  const reposSignale = { current: 123 };
  vm.runInNewContext(ts.transpileModule(transition + '\nsuivant();', {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    index, steps, step: steps[index], reposSignale, Date: { now: () => 100000 },
    setConsigneOuverte() {}, setNomsRealises() {}, substitutions: {},
    setRepos: value => { rest = value; }, setIndex: value => { nextIndex = value; },
    terminerSeance() { throw Error('Unexpected completion'); },
  });
  assert.equal(nextIndex, index + 1);
  assert.equal(reposSignale.current, null);
  if (index === 0) { assert.equal(rest.index, 1); assert.equal(rest.fin, 190000); }
  else assert.equal(rest, undefined);
}
console.log('PASS: actual rest initializer/transition, restored/expired deadline, mismatched draft, enter/leave rest. Simulated clock/state, not iPhone E2E.');
