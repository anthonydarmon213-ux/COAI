// Real component handlers; simulated React hooks and API, no personal data written.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
let states = [], cursor = 0, refreshes = 0, ok = false, requests = 0;
const box = { exports: {}, fetch: async () => { requests++; return { ok }; }, require: name => {
  if (name === 'react') return {
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], v => { states[i] = v; }]; },
    useRef: () => ({ current: null }), useId: () => 'weekly-title', useEffect: () => {},
  };
  if (name === 'next/navigation') return { useRouter: () => ({ refresh: () => refreshes++ }) };
  if (name.startsWith('@/components/ui/')) return new Proxy({}, { get: (_, key) => key });
  return require(name);
} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/dashboard/weekly-checkin-card.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
function nodes(n, out = []) { if (Array.isArray(n)) n.forEach(v => nodes(v, out)); else if (n?.props) { out.push(n); nodes(n.props.children, out); } return out; }
function entry() { cursor = 0; return nodes(box.exports.WeeklyCheckinButton()); }
(async () => {
  entry().find(n => n.type === 'Button').props.onClick();
  const modal = entry().find(n => typeof n.type === 'function');
  assert(modal, 'entry must mount weekly form');
  modal.props.onClose();
  assert(!entry().some(n => typeof n.type === 'function'));
  states = [];
  function form() { cursor = 0; return nodes(modal.type(modal.props)); }
  assert.equal(form().find(n => n.type === 'dialog').props['aria-labelledby'], 'weekly-title');
  await form().find(n => n.type === 'Button').props.onClick();
  assert(form().some(n => n.props.role === 'alert'));
  assert.equal(refreshes, 0);
  ok = true;
  await form().find(n => n.type === 'Button').props.onClick();
  assert.equal(refreshes, 1); assert.equal(requests, 2);
  const coach = fs.readFileSync('src/app/(app)/coach/page.tsx', 'utf8');
  assert(coach.includes('<WeeklyCheckinButton />'));
  assert(!coach.includes('/dashboard#check-in-du-jour'));
  console.log('PASS: weekly entry, close, error, successful refresh; API simulated, dialog browser behavior not covered');
})().catch(e => { console.error(e); process.exitCode = 1; });
