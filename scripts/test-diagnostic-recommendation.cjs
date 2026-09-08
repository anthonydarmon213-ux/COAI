const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const box = { exports: {} };
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync('src/lib/diagnostic/mini-diagnostic.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, box);
const base = { niveau: 'Débutant', objectif: 'Retrouver la forme', equipement: ['Aucun matériel'], frequence: '2 fois par semaine', duree: '30 minutes', sante: [] };
for (const [name, patch, expected] of [
  ['autonome', {}, 'COAI Essentiel'],
  ['hybride', { coachPreference: 'HYBRIDE' }, 'Premium Remote'],
  ['VIP Paris', { coachPreference: 'VIP_PRESENTIEL', localisation: 'PARIS' }, 'VIP Présentiel'],
  ['VIP ailleurs', { coachPreference: 'VIP_PRESENTIEL', localisation: 'AILLEURS' }, 'Premium Remote'],
  ['VIP sans localisation', { coachPreference: 'VIP_PRESENTIEL' }, 'Premium Remote'],
  ['VIP localisation nulle', { coachPreference: 'VIP_PRESENTIEL', localisation: null }, 'Premium Remote'],
]) {
  const result = box.exports.buildMiniDiagnostic({ ...base, ...patch });
  assert.equal(result.recommandation.label, expected, name);
  if (expected === 'VIP Présentiel') assert.doesNotMatch(result.recommandation.raison, /distance/);
  console.log(`PASS ${name}: ${expected}`);
}
