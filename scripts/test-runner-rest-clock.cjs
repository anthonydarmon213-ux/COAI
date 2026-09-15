const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const start = source.indexOf('    const actualiser = () => {');
const end = source.indexOf('\n    actualiser();', start);
assert.ok(start > 0 && end > start);
let now = 1000, remaining, beeps = 0;
const repos = { index: 1, fin: 91000 };
const box = { repos, Date: { now: () => now }, Math,
  setSecondesRestantes: value => { remaining = value; },
  reposSignale: { current: null }, bip: () => { beeps++; } };
vm.runInNewContext(ts.transpileModule(source.slice(start, end) + '\nglobalThis.tick = actualiser;', {}).outputText, box);
box.tick(); assert.equal(remaining, 90);
now += 60000; box.tick(); assert.equal(remaining, 30);
now += 60000; box.tick(); assert.equal(remaining, 0); assert.equal(beeps, 1);
box.tick(); assert.equal(beeps, 1);
repos.fin = now + 15000; box.tick(); assert.equal(remaining, 15);
now += 15000; box.tick(); assert.equal(remaining, 0); assert.equal(beeps, 2);
assert.ok(source.includes('nomsRealises, repos } satisfies SeanceSauvegardee'));
assert.ok(source.includes('document.removeEventListener("visibilitychange", actualiser)'));
console.log('PASS callback réel : réveil tardif, zéro sans négatif, bip unique, nouveau repos après ajout ; échéance incluse au brouillon. Limite : pas un test navigateur du remontage.');
