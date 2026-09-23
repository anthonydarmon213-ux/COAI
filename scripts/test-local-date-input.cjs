const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, require) {
  const box = { exports: {}, require, Date };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, box);
  return box.exports;
}
const { localCalendarDay } = load('src/lib/suivi/calendar-day.ts');
const originalTZ = process.env.TZ;
try {
  for (const [zone, instant, day] of [
    ['Europe/Paris', '2026-09-23T22:30:00Z', '2026-09-24'],
    ['America/Los_Angeles', '2026-09-23T01:30:00Z', '2026-09-22'],
    ['Pacific/Kiritimati', '2026-12-31T11:00:00Z', '2027-01-01'],
    ['Europe/Paris', '2026-03-29T00:30:00Z', '2026-03-29'],
  ]) {
    process.env.TZ = zone;
    assert.equal(localCalendarDay(new Date(instant)), day);
    let state; let calls = 0; let server = true;
    const { useLocalDateInput } = load('src/lib/suivi/use-local-date-input.ts', name => {
      if (name === 'react') return {
        useState: initial => { if (state === undefined) state = initial; return [state, v => { state = typeof v === 'function' ? v(state) : v; }]; },
        useSyncExternalStore: (_subscribe, snapshot, serverSnapshot) => server ? serverSnapshot() : snapshot(),
      };
      if (name === './calendar-day') return { localCalendarDay: () => { calls++; return localCalendarDay(new Date(instant)); } };
      throw Error(name);
    });
    const [initial, setDate] = useLocalDateInput();
    assert.equal(initial, ''); assert.equal(calls, 0);
    server = false; assert.equal(useLocalDateInput()[0], day);
    setDate('2026-08-15'); assert.equal(useLocalDateInput()[0], '2026-08-15');
    setDate(''); assert.equal(useLocalDateInput()[0], '');
  }
} finally {
  if (originalTZ === undefined) delete process.env.TZ; else process.env.TZ = originalTZ;
}
for (const name of ['seance-form', 'mesure-form', 'test-maxi-form']) {
  const source = fs.readFileSync(`src/components/suivi/${name}.tsx`, 'utf8');
  assert.ok(source.includes('const [date, setDate] = useLocalDateInput()'));
  assert.ok(!source.includes('new Date().toISOString().slice(0, 10)'));
}
console.log('PASS: four timezone boundaries, hydration-safe initial state and preservation of manual dates in three forms.');
