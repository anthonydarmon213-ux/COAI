// Real shared adaptation function. No account, database or paid generation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require(name) {
    if (name.startsWith('@/lib/')) return load(path.resolve('src', name.slice(2) + '.ts'));
    throw new Error(name);
  } });
  return exports;
}
const exportsObject = load(path.resolve('src/lib/daily/session.ts'));
const { adaptWorkout } = exportsObject;
const {resolveDailyContext} = load(path.resolve('src/lib/daily/context.ts'));
const contextDate = new Date(2026, 8, 24);
const contextSource = {jour: 'Jeudi', nom: 'Séance actuelle', exercices: []};
const contextProgramme = {id: 'current', version: 2, contenu: {seances: [contextSource]}};
const contextDaily = {programmeSourceId: 'current', programmeVersion: 2, sourceSession: contextSource, sleep: 'BON', completedAt: null};
assert.equal(resolveDailyContext(contextProgramme, contextDaily, contextDate).initialDaily, contextDaily);
for (const stale of [{...contextDaily, programmeSourceId: 'old'}, {...contextDaily, programmeVersion: 1}, {...contextDaily, sourceSession: null}]) {
  const result = resolveDailyContext(contextProgramme, stale, contextDate);
  assert.equal(result.changed, true);
  assert.equal(result.initialDaily, null);
  assert.equal(result.sourceSession, contextSource);
}
const completedDaily = {...contextDaily, programmeSourceId: 'old', programmeVersion: 1, completedAt: new Date(), sourceSession: {...contextSource, nom: 'Séance terminée'}};
const completedContext = resolveDailyContext({...contextProgramme, contenu: {seances: []}}, completedDaily, contextDate);
assert.equal(completedContext.sourceSession, completedDaily.sourceSession);
assert.equal(completedContext.initialDaily, completedDaily);
assert.equal(completedContext.programmeVersion, 1);
assert.equal(resolveDailyContext(null, completedDaily, contextDate).sourceSession, null, 'No bypass without accessible programme');
console.log('PASS daily context: changed programme requires check-in; completed snapshot/version retained; no programme bypass');
const originalOnly = { nom: 'Sans finisher ajouté', exercices: [{ nom: 'Leg curl (machine)', series: 3 }] };
const normalised = exportsObject.ensureWorkoutCompleteness(originalOnly);
assert.equal(JSON.stringify(normalised.exercices), JSON.stringify(originalOnly.exercices), 'Do not append an unapproved automatic finisher');
assert.equal(JSON.stringify(exportsObject.ensureWorkoutCompleteness(normalised).exercices), JSON.stringify(originalOnly.exercices));
const checkin = { sleep: 'BON', energy: 'NORMALE', pain: false, availableMinutes: 60,
  equipementDuJour: 'Sans matériel' };
const source = { nom: 'Séance de test', echauffement: 'Rameur', retourAuCalme: 'Vélo',
  exercices: [{ nom: 'Leg curl (machine)', series: 3 }, { nom: 'Développé couché (barre)', series: 3 }] };
const before = JSON.stringify(source);
const none = adaptWorkout(source, checkin, 60);
assert.equal(none.session.exercices.length, 0, 'Never retain unavailable equipment when all exercises are incompatible');
assert.equal(none.session.echauffement, undefined, 'Do not retain an equipment-dependent warm-up');
assert.equal(none.session.retourAuCalme, undefined, 'Do not retain an equipment-dependent cooldown');
assert.equal(none.summary.adapted, true);
assert.equal(none.summary.adaptedExerciseCount, 0);
assert.match(none.summary.reason, /matériel/);
assert.equal(JSON.stringify(source), before, 'Stored programme stays unchanged');
const mixed = adaptWorkout({ ...source, exercices: [...source.exercices, { nom: 'Crunch', series: 2 }] }, checkin, 60);
assert.equal(JSON.stringify(mixed.session.exercices.map(e => e.nom)), JSON.stringify(['Crunch']));
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
  if (name === 'react') return { useState: value => [typeof value === 'function' ? value() : value, () => {}], useMemo: fn => fn(), useSyncExternalStore: (_subscribe, _snapshot, serverSnapshot) => serverSnapshot() };
  if (name === 'next/navigation') return { useRouter: () => ({ refresh() {} }) };
  if (name === 'next/link') return { default: 'link' };
  if (name === 'next/image') return { default: 'image' };
  if (name.endsWith('/exercice-video')) return { ExerciceVideo: 'video' };
  if (name.endsWith('/coai-image-mark')) return { CoaiImageMark: 'mark' };
  if (name === '@/lib/exercices/photos-coai') return load(path.resolve('src/lib/exercices/photos-coai.ts'));
  if (name === '@/lib/daily/session') return exportsObject;
  if (name === '@/lib/daily/progress-store') return load(path.resolve('src/lib/daily/progress-store.ts'));
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
function render(session, completedAt = null) {
  return nodes(uiExports.DailyExperience({ sourceSession: source, expectedMinutes: 60, pendingCoach: false,
    programmeVersion: 1, initialDaily: { sleep: 'BON', energy: 'NORMALE', pain: false, adaptedSession: session, completedAt } }));
}
const emptyNodes = render(none.session);
assert.ok(emptyNodes.some(n => n.props?.href === '/programme/entrainement'));
assert.ok(!emptyNodes.some(n => n.props?.children === 'Commencer ma séance'));
assert.ok(render(gym.session).some(n => n.props?.children === 'Commencer ma séance'));
const finishedNodes = render(gym.session, '2026-09-24T12:00:00.000Z');
assert.ok(finishedNodes.some(n => n.props?.role === 'status' && /Séance terminée et enregistrée/.test(n.props.children)));
assert.ok(!finishedNodes.some(n => n.props?.children === 'Progression de la séance'), 'Completed sessions must not show a reset or invented percentage');
assert.ok(render(gym.session).some(n => n.props?.children === 'Progression de la séance'), 'Keep live progress for unfinished sessions');
const mobility = adaptWorkout(source, { ...checkin, chargeMentale: 'SATUREE' }, 60);
assert.ok(render(mobility.session).some(n => n.props?.children === 'Commencer ma séance'), 'Keep the existing guided recovery flow');
for (const entries of [[{ nom: 'Hip thrust barre' }, { nom: 'Leg curl allongé', series: 3 }], [{ nom: 'Hip thrust barre' }], [null, 42]]) {
  const old = { nom: 'Historique', exercices: entries, echauffement: 'Ancien échauffement' };
  const snapshot = JSON.stringify(old);
  const adapted = adaptWorkout(old, { ...checkin, equipementDuJour: 'Salle de sport complète' }, 60);
  const expected = entries.some(e => e?.nom === 'Leg curl allongé') ? ['Leg curl (machine)'] : [];
  assert.equal(JSON.stringify(adapted.session.exercices.map(e => e.nom)), JSON.stringify(expected));
  assert.equal(adapted.summary.adapted, true);
  assert.equal(adapted.summary.adaptedExerciseCount, expected.length);
  assert.equal(adapted.summary.originalExerciseCount, entries.length);
  assert.equal(JSON.stringify(old), snapshot);
  // Existing saved sessions and freshly adapted sessions must render the same exercises.
  for (const session of [old, JSON.parse(JSON.stringify(adapted.session))]) {
    const tree = render(session);
    const cards = tree.filter(n => n.type?.name === 'Exercise');
    assert.equal(JSON.stringify(cards.map(n => n.props.data.nom)), JSON.stringify(expected));
    assert.equal(tree.some(n => n.props?.children === 'Commencer ma séance'), expected.length > 0);
    for (const card of cards) {
      const opened = nodes(card.type({ ...card.props, active: true }));
      assert.ok(opened.some(n => n.type === 'video' && n.props.nom === 'Leg curl (machine)'));
      assert.ok(opened.some(n => n.type === 'image' && n.props.src.startsWith('/exercices/')));
      const closed = nodes(card.type({ ...card.props, active: false }));
      assert.ok(!closed.some(n => n.type === 'video'), 'No video loaded for folded cards');
    }
  }
}
console.log('PASS: unavailable equipment removes all incompatible exercises; partial/gym/pain paths and source preserved.');
