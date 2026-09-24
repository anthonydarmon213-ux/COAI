// Real shared adaptation function. No account, database or paid generation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/daily/session.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject });
const { adaptWorkout } = exportsObject;
const checkin = { sleep: 'BON', energy: 'NORMALE', pain: false, availableMinutes: 60,
  equipementDuJour: 'Sans matériel' };
const source = { nom: 'Séance de test', echauffement: 'Rameur', retourAuCalme: 'Vélo',
  exercices: [{ nom: 'Crunch à la poulie', series: 3 }, { nom: 'Développé couché barre', series: 3 }] };
const before = JSON.stringify(source);
const none = adaptWorkout(source, checkin, 60);
assert.equal(none.session.exercices.length, 0, 'Never retain unavailable equipment when all exercises are incompatible');
assert.equal(none.session.echauffement, undefined, 'Do not retain an equipment-dependent warm-up');
assert.equal(none.session.retourAuCalme, undefined, 'Do not retain an equipment-dependent cooldown');
assert.equal(none.summary.adapted, true);
assert.equal(none.summary.adaptedExerciseCount, 0);
assert.match(none.summary.reason, /matériel/);
assert.equal(JSON.stringify(source), before, 'Stored programme stays unchanged');
const mixed = adaptWorkout({ ...source, exercices: [...source.exercices, { nom: 'Planche', series: 2 }] }, checkin, 60);
assert.equal(JSON.stringify(mixed.session.exercices.map(e => e.nom)), JSON.stringify(['Planche']));
assert.equal(mixed.summary.adaptedExerciseCount, 1);
const gym = adaptWorkout(source, { ...checkin, equipementDuJour: 'Salle de sport complète' }, 60);
assert.equal(gym.session.exercices.length, 2);
assert.equal(gym.summary.adapted, false);
const pain = adaptWorkout(source, { ...checkin, pain: true }, 60);
assert.equal(pain.session.exercices.length, 0);
assert.match(pain.summary.reason, /douleur/);
// Render the real parent component with inert children/hooks. No DOM or network.
const uiExports = {};
const jsx = (type, props) => ({ type, props });
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/daily/daily-experience.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: uiExports, require(name) {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
  if (name === 'react') return { useState: value => [typeof value === 'function' ? value() : value, () => {}] };
  if (name === 'next/navigation') return { useRouter: () => ({ refresh() {} }) };
  if (name === 'next/link') return { default: 'link' };
  if (name === '@/lib/daily/session') return exportsObject;
  if (name.endsWith('/button')) return { Button: 'button' };
  if (name.endsWith('/daily-coach')) return { DailyCoach: 'coach' };
  if (name.endsWith('/share-progress-card-button')) return { ShareProgressCardButton: 'share' };
  throw new Error(name);
} });
function nodes(value, found = []) {
  if (Array.isArray(value)) value.forEach(v => nodes(v, found));
  else if (value && typeof value === 'object') { found.push(value); nodes(value.props?.children, found); }
  return found;
}
function render(session) {
  return nodes(uiExports.DailyExperience({ sourceSession: source, expectedMinutes: 60, pendingCoach: false,
    programmeVersion: 1, initialDaily: { sleep: 'BON', energy: 'NORMALE', pain: false, adaptedSession: session } }));
}
const emptyNodes = render(none.session);
assert.ok(emptyNodes.some(n => n.props?.href === '/programme/entrainement'));
assert.ok(!emptyNodes.some(n => n.props?.children === 'Commencer ma séance'));
assert.ok(render(gym.session).some(n => n.props?.children === 'Commencer ma séance'));
const mobility = adaptWorkout(source, { ...checkin, chargeMentale: 'SATUREE' }, 60);
assert.ok(render(mobility.session).some(n => n.props?.children === 'Commencer ma séance'), 'Keep the existing guided recovery flow');
console.log('PASS: unavailable equipment removes all incompatible exercises; partial/gym/pain paths and source preserved.');
