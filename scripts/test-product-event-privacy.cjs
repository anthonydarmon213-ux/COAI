const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const logs = [];
const box = {exports: {}, console: {log: (...args) => logs.push(args)}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/analytics/product-events.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS},
}).outputText, box);
const track = box.exports.trackServerEvent;
track('travel_mode_started', 'owned-user', {userId: 'forged-user', finPrevue: '2030-01-02',
  type: 'PRUDENCE_DOULEUR', decision: 'health inference', commentaire: 'private note',
  nested: {email: 'private@example.test'}, pilier: 'ENTRAINEMENT', first: false, source: 'MONTRE'});
assert.deepEqual(JSON.parse(JSON.stringify(logs[0])), ['[product-event] travel_mode_started',
  {userId: 'owned-user', first: false, pilier: 'ENTRAINEMENT', source: 'MONTRE'}]);
track('diagnostic_email_sent', null);
assert.deepEqual(JSON.parse(JSON.stringify(logs[1])), ['[product-event] diagnostic_email_sent', {userId: null}]);
for (const invalid of [null, 7, [], {}, 'private note', true]) {
  track('workout_completed', 'owned-user', {first: invalid, pilier: invalid, source: invalid});
  const expected = typeof invalid === 'boolean' ? {userId: 'owned-user', first: invalid} : {userId: 'owned-user'};
  assert.deepEqual(JSON.parse(JSON.stringify(logs.at(-1)[1])), expected);
}
console.log('PASS actual event logger: strict metadata allowlist, false preserved, anonymous supported, owner cannot be overwritten; no free text/date/health inference copied');
console.log('LIMIT: user ID and event name remain logged; no claim of anonymous analytics or production log deletion');
