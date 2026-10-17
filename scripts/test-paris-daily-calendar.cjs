const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
function load(file, dependencies = {}, clock = Date) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, Date: clock, Intl, URL, console, require: name => {
    assert(Object.hasOwn(dependencies, name), name); return dependencies[name];
  } });
  return exports;
}
const calendar = load('src/lib/daily/calendar.ts');
const session = load('src/lib/daily/session.ts', { '@/lib/daily/calendar': calendar });
const names = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const program = { seances: names.map(jour => ({ jour, nom: jour,
  exercices: [{ nom: 'Développé couché (barre)', series: '2', repetitions: '8', repos: '60 s' }] })) };
const cases = [
  ['2026-03-28T22:30:00Z', '2026-03-28', 'samedi'],
  ['2026-03-28T23:30:00Z', '2026-03-29', 'dimanche'],
  ['2026-03-29T01:30:00Z', '2026-03-29', 'dimanche'],
  ['2026-10-24T22:30:00Z', '2026-10-25', 'dimanche'],
  ['2026-10-25T01:30:00Z', '2026-10-25', 'dimanche'],
  ['2026-07-14T22:30:00Z', '2026-07-15', 'mercredi'],
  ['2026-10-12T23:30:00Z', '2026-10-13', 'mardi'],
];
for (const [instant, day, name] of cases) {
  const now = new Date(instant);
  assert.equal(calendar.parisCalendarDate(now).toISOString(), `${day}T00:00:00.000Z`);
  assert.equal(session.getWorkoutForDate(program, now)?.nom, name, instant);
  const shortened = { seances: [{ ...program.seances.find(s => s.jour === name), jour: name.slice(0, 3).toUpperCase() }] };
  assert.equal(session.getWorkoutForDate(shortened, now)?.nom, name, 'French abbreviated weekdays are accepted');
}
assert.equal(session.getWorkoutForDate(program, new Date('invalid')), null);
const original = program.seances[0];
const snapshot = JSON.stringify(original);
for (const overrides of [{}, { energy: 'BASSE' }, { availableMinutes: 15 },
  { pain: true }, { chargeMentale: 'SATUREE' }]) {
  const result = session.adaptWorkout(original, {
    sleep: 'BON', energy: 'NORMALE', pain: false, availableMinutes: 40, ...overrides,
  }, 40);
  assert(result.session.exercices.every(exercise => original.exercices.some(source => source.nom === exercise.nom)),
    'Adaptation must never invent an exercise without approved media');
  assert.equal(result.summary.originalExerciseCount, original.exercices.length);
  assert.equal(JSON.stringify(original), snapshot, 'Source programme must remain intact');
}
assert.equal(session.ensureWorkoutCompleteness(original).exercices.length, 1);
const checkin = { sleep: 'BON', energy: 'NORMALE', pain: false, availableMinutes: 40 };
const unavailable = session.adaptWorkout(original, { ...checkin, equipementDuJour: 'Sans matériel' }, 40);
assert.equal(unavailable.session.exercices.length, 0, 'No equipment must not retain a barbell exercise');
assert.equal(unavailable.summary.adapted, true);
assert.equal(unavailable.summary.originalExerciseCount, 1);
assert.match(unavailable.session.retourAuCalme, /Modifie ton matériel/);
assert.equal(JSON.stringify(original), snapshot);
assert.equal(session.adaptWorkout(original, { ...checkin, equipementDuJour: 'Salle de sport complète' }, 40).session.exercices.length, 1);
const mixed = { exercices: [...original.exercices, { nom: 'Pompes', series: '3' }] };
assert.deepEqual(Array.from(session.adaptWorkout(mixed, { ...checkin, equipementDuJour: 'Sans matériel' }, 40).session.exercices, ex => ex.nom), ['Pompes']);
assert.equal(session.getWorkoutForDate({ seances: [{ jour: 'lunettes', nom: 'wrong' }] }, new Date('2026-10-12T12:00:00Z')), null);
async function routes() {
  for (const [instant, day, name] of cases) {
    const millis = Date.parse(instant);
    class Clock extends Date { constructor(...args) { super(...(args.length ? args : [millis])); } static now() { return millis; } }
    let read, written, source;
    const database = {
      user: { findUnique: async () => ({ id: 'qa-owner', profile: {} }) },
      programmeGenerated: { findFirst: async () => ({ id: 'qa-plan', version: 1, statut: 'VALIDE', contenu: program }) },
      dailySession: {
        findUnique: async query => {
          read = query.where.userId_date.date;
          return query.select?.completedAt ? {
            completedAt: new Clock(), workoutRating: 'BIEN_DOSEE', availableMinutes: 40,
          } : null;
        },
        upsert: async query => { written = query.where.userId_date.date; source = query.create.sourceSession; return { id: 'qa-daily' }; },
        count: async () => 0,
      },
    };
    const dependencies = { 'next/server': { NextResponse }, zod: require('zod'), '@prisma/client': require('@prisma/client'),
      '@/lib/auth/server': { getCurrentUser: async () => ({ id: 'qa-auth' }) },
      '@/lib/db/client': { prisma: database }, '@/lib/daily/session': session,
      '@/lib/programmes/access': { accessibleTraining: (_validated, latest) => latest },
      '@/lib/daily/calendar': { parisCalendarDate: () => calendar.parisCalendarDate(new Clock()) },
    };
    const daily = load('src/app/api/daily/route.ts', dependencies, Clock);
    assert.equal((await daily.GET()).status, 200);
    assert.equal(read.toISOString(), `${day}T00:00:00.000Z`);
    assert.equal((await daily.POST(new Request('https://coai.example/api/daily', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        action: 'checkin', sleep: 'BON', energy: 'NORMALE', pain: false, availableMinutes: 40,
      }) }))).status, 200);
    assert.equal(written.toISOString(), `${day}T00:00:00.000Z`);
    assert.equal(source.nom, name, 'The DB day and adapted workout must agree');
    const card = load('src/app/api/daily/carte/route.tsx', {
      ...dependencies, 'react/jsx-runtime': require('react/jsx-runtime'),
      'next/og': { ImageResponse: class extends Response { constructor() { super('qa-image'); } } },
    }, Clock);
    assert.equal((await card.GET()).status, 200);
    assert.equal(read.toISOString(), `${day}T00:00:00.000Z`);
  }
  console.log(`PASS: Paris midnight/DST, full and abbreviated weekdays, invalid dates, daily read/write/card date coherence under ${process.env.TZ || 'system timezone'}. Auth/DB/image mocked.`);
}
routes().catch(error => { console.error(error.message); process.exitCode = 1; });
