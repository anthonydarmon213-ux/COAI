const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const start = source.indexOf('  // WKWebView changes its height');
const end = source.indexOf('  // Interrompre la voix', start);
assert(start > 0 && end > start);
const code = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function target() {
  const listeners = new Map();
  return { listeners, addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); } };
}
for (const withViewport of [true, false]) {
  const reader = target(), window = target(), viewport = target();
  window.visualViewport = withViewport ? viewport : null;
  let scrolls = 0, cleanup, next = 0;
  class Input { scrollIntoView(options) { assert.equal(options.block, 'center'); scrolls++; } }
  const input = new Input();
  const document = { activeElement: input };
  reader.contains = node => node === input;
  const timers = new Map();
  const flush = () => { const tasks = [...timers.values()]; timers.clear(); tasks.forEach(fn => fn()); };
  vm.runInNewContext(code, { readerRef: { current: reader }, coachConsentOpen: false,
    document, window, HTMLInputElement: Input,
    useEffect: fn => { cleanup = fn(); },
    setTimeout: fn => { timers.set(++next, fn); return next; }, clearTimeout: id => timers.delete(id) });
  reader.listeners.get('focusin')(); window.listeners.get('resize')();
  if (withViewport) viewport.listeners.get('resize')();
  assert.equal(timers.size, 1, 'Keyboard resize events are debounced');
  flush(); assert.equal(scrolls, 1);
  document.activeElement = new Input();
  window.listeners.get('resize')(); flush(); assert.equal(scrolls, 1, 'Unrelated fields must not scroll');
  document.activeElement = input;
  reader.listeners.get('focusin')(); cleanup(); flush();
  assert.equal(scrolls, 1, 'Closing the reader cancels pending scrolling');
  assert.equal(reader.listeners.size + window.listeners.size + viewport.listeners.size, 0);
}
console.log('PASS keyboard visibility lifecycle: debounced focus/resize, reader isolation, cleanup, no VisualViewport fallback. DOM simulation only.');
