const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const out = {}, values = new Map(), listeners = new Map();
let denied = false, now = 0, timer, cleared = false;
const events = {
  addEventListener: (name, callback) => listeners.set(name, callback),
  removeEventListener: (name, callback) => { assert.equal(listeners.get(name), callback); listeners.delete(name); }
};
class Clock extends Date { static now() { return now; } }
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/suivi/challenge-store.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, {
  exports: out, Date: Clock, Event,
  localStorage: {
    getItem: key => { if (denied) throw Error('denied'); return values.get(key) ?? null; },
    setItem: (key, value) => { if (denied) throw Error('denied'); values.set(key, value); }
  },
  window: { ...events, setInterval: callback => { timer = callback; return 1; }, clearInterval: () => { cleared = true; }, dispatchEvent: event => listeners.get(event.type)?.() },
  document: events
});
assert.equal(out.serverChallengeDay(), 0);
assert.equal(out.serverChallengeDays(), '[]');
assert.equal(JSON.stringify(out.completedDays('[1,1,8,0,"2",2,null]')), '[1,2]');
assert.equal(JSON.stringify(out.completedDays('bad')), '[]');
const a = out.challengeStore('a', new Date(0).toISOString());
const b = out.challengeStore('b', 'invalid');
assert.equal(a.day(), 1);
now = 3 * 86400000;
assert.equal(a.day(), 4);
now = 30 * 86400000;
assert.equal(a.day(), 7);
assert.equal(b.day(), 1);
let refreshed = 0;
const stop = a.subscribe(() => refreshed++);
assert.equal(a.toggle(1), true);
assert.equal(a.read(), '[1]');
assert.equal(b.read(), '[]');
assert.equal(a.toggle(1), false);
assert.equal(a.read(), '[]');
assert.equal(a.toggle(9), false);
denied = true;
assert.equal(a.toggle(2), true);
assert.equal(a.read(), '[2]');
assert.equal(b.read(), '[]');
timer(); listeners.get('pageshow')(); listeners.get('visibilitychange')();
assert.equal(refreshed, 6);
stop();
assert.equal(listeners.size, 0);
assert.equal(cleared, true);
console.log('PASS challenge: account isolation, malformed/duplicate days, bounded day, storage refusal, resume and cleanup. Simulated browser.');
