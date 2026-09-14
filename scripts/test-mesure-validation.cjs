// Actual schema, route and form handlers; database and network are mocked.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
function load(path, overrides = {}, globals = {}) {
  const box = { exports: {}, ...globals, require: n => n in overrides ? overrides[n] : require(n) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, box);
  return box.exports;
}
const validation = load('src/lib/suivi/mesure-validation.ts');
const date = '2026-09-14';
const invalid = [{ date }, { date, notes: ' ', photoPath: ' ' }, { date: '', poidsKg: 80 },
  { date, poidsKg: -1 }, { date, poidsKg: 501 }, { date, tourTailleCm: 301 },
  { date, masseGrassePourcent: 101 }, { date, masseMusculaireKg: 201 },
  { date, frequenceCardiaqueReposBpm: 60.5 }, { date, frequenceCardiaqueReposBpm: 19 }];
const valid = [{ date, poidsKg: 80 }, { date, tourTailleCm: 90 }, { date, masseGrassePourcent: 0 },
  { date, masseMusculaireKg: 50 }, { date, frequenceCardiaqueReposBpm: 60 },
  { date, photoPath: 'owned/photo.jpg' }, { date, notes: 'Suivi' }];
let writes = 0, auth = { id: 'test' };
const route = load('src/app/api/mesures/route.ts', {
  '@/lib/suivi/mesure-validation': validation,
  'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
  '@/lib/auth/server': { getCurrentUser: async () => auth },
  '@/lib/storage/progress-photos': { isOwnedProgressPhotoPath: (_, path) => path.startsWith('owned/') },
  '@/lib/db/client': { prisma: { user: { findUnique: async () => ({ id: 'user' }) },
    mesure: { create: async ({ data }) => { writes++; return data; } } } },
});
let states, cursor, refs, refCursor, calls, compressions, refreshes;
const form = load('src/components/suivi/mesure-form.tsx', {
  '@/lib/suivi/mesure-validation': validation,
  react: {
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], v => { states[i] = v; }]; },
    useRef: value => { const i = refCursor++; return refs[i] ?? (refs[i] = { current: value }); },
  },
  'next/navigation': { useRouter: () => ({ refresh: () => refreshes++ }) },
  '@/components/ui/button': { Button: 'button' }, '@/components/ui/input': { Input: 'input' },
  '@/components/ui/field': { Field: 'label' }, '@/components/ui/card': { Card: 'section' },
  '@/components/ui/section-label': { SectionLabel: 'span' },
  '@/lib/images/compress-progress-photo': { compressProgressPhoto: async () => { compressions++; return { file: 'mock-file' }; } },
}, {
  HTMLInputElement: class {}, FormData: class { append() {} },
  fetch: async (url, init) => { calls.push({ url, body: init.body }); return { ok: true, json: async () => ({ path: 'owned/photo.jpg' }) }; },
});
function find(n, predicate) {
  if (!n || typeof n !== 'object') return;
  if (predicate(n)) return n;
  for (const c of [n.props?.children].flat(Infinity)) { const match = find(c, predicate); if (match) return match; }
}
function render() { cursor = refCursor = 0; return form.MesureForm(); }
function reset() { states = []; refs = []; calls = []; compressions = refreshes = 0; render(); }
function change(name, value) { find(render(), n => n.props?.name === name).props.onChange({ target: { value } }); }
function photo() { find(render(), n => n.props?.type === 'file').props.onChange({ target: { files: [{}] } }); }
function submit() { return find(render(), n => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { elements: { namedItem: () => null } } }); }
(async () => {
  for (const input of invalid) {
    assert.equal(validation.mesureBodySchema.safeParse(input).success, false);
    const before = writes;
    const response = await route.POST({ json: async () => input });
    assert.equal(response.status, 400); assert.equal(writes, before);
    assert.equal(typeof response.body.error, 'string');
  }
  for (const input of valid) { assert.equal(validation.mesureBodySchema.safeParse(input).success, true); assert.equal((await route.POST({ json: async () => input })).status, 201); }
  const before = writes;
  assert.equal((await route.POST({ json: async () => ({ date, photoPath: 'someone-else/photo.jpg' }) })).status, 400);
  auth = null;
  assert.equal((await route.POST({ json: async () => valid[0] })).status, 401);
  assert.equal(writes, before);
  reset(); await submit(); assert.equal(calls.length, 0);
  assert.match(find(render(), n => n.props?.role === 'alert').props.children, /au moins une mesure/);
  reset(); photo(); change('poidsKg', '-1'); await submit();
  assert.equal(calls.length, 0); assert.equal(compressions, 0);
  assert.equal(find(render(), n => n.props?.name === 'poidsKg').props.value, '-1');
  assert.equal(find(render(), n => n.props?.name === 'poidsKg').props['aria-invalid'], true);
  reset(); change('poidsKg', '80'); await submit(); assert.equal(calls.length, 1); assert.equal(refreshes, 1);
  reset(); photo(); await Promise.all([submit(), submit()]);
  assert.equal(compressions, 1); assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1].body).photoPath, 'owned/photo.jpg');
  console.log('PASS: empty/invalid/valid measures, photo alone, ownership/auth, pre-upload validation, preserved draft, duplicate-submit guard. No real writes.');
})().catch(e => { console.error(e); process.exitCode = 1; });
