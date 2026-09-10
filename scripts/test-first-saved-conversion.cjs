// Real save handlers and conversion parser; React lifecycle, API and SDKs
// simulated. No account, database, external tracker or email is contacted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname, '..');
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, console, Date, ...globals, require: name => name in dependencies ? dependencies[name] : require(name) });
  return exports;
}
const parser = load('src/lib/analytics/first-saved-conversion.ts');
const id = '11111111-2222-4333-8444-555555555555';
function response(source, { status = 201, first = '1', body = { id, source } } = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status, headers: { 'X-COAI-First-Source': first, 'Content-Type': 'application/json' },
  });
}
function TrackConversion() { return null; }
function SeanceBilan() { return null; }
const componentStubs = new Proxy({ TrackConversion, SeanceBilan }, { get: (target, key) => target[key] ?? (() => null) });
const functions = new Proxy({}, { get: (_, key) => key === 'variantesPourExercice' || key === 'musclesPourExercice' ? () => [] : () => null });
function harness(source, reply) {
  const states = [], refs = [];
  let stateIndex = 0, refIndex = 0, posts = 0;
  const hooks = {
    ...React,
    useState: initial => {
      const i = stateIndex++;
      if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }];
    },
    useRef: initial => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
    useEffect() {}, useMemo: fn => fn(), useCallback: fn => fn,
  };
  const deps = {
    react: hooks,
    '@/components/analytics/track-conversion': { TrackConversion },
    '@/lib/analytics/first-saved-conversion': parser,
    '@/lib/suivi/historique-exercice': load('src/lib/suivi/historique-exercice.ts'),
    '@/lib/programmes/repos': load('src/lib/programmes/repos.ts'),
  };
  const file = source === 'PROGRAMME' ? 'src/components/programme/seance-runner.tsx' : 'src/components/suivi/repcount.tsx';
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, console, Date,
    fetch: async (_url, options) => {
      if (options?.method !== 'POST') return Response.json([]);
      posts++;
      assert.equal(JSON.parse(options.body).source, source);
      return reply();
    },
    require: name => name in deps ? deps[name] : name.startsWith('@/components/') ? componentStubs : name.startsWith('@/lib/') ? functions : require(name),
  });
  const component = source === 'PROGRAMME' ? exports.SeanceRunner : exports.RepCount;
  const props = source === 'PROGRAMME'
    ? { nomSeance: 'Fixture', exercices: [{ nom: 'Fixture', series: '1', repetitions: '10', repos: '1 min' }], onClose() {} }
    : { exercices: ['Fixture'], exerciceInitial: 'Fixture', onboarding: true };
  return {
    render() { stateIndex = 0; refIndex = 0; return component(props); },
    get posts() { return posts; },
  };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)];
}
async function save(h, source) {
  const button = nodes(h.render()).find(n => n.type === 'button' && String(n.props.children).includes(source === 'PROGRAMME' ? 'Terminer la séance' : 'Enregistrer mon premier repère'));
  assert.ok(button, 'Actual save button exists');
  await button.props.onClick();
  // The runner intentionally dispatches its async handler without awaiting it.
  for (let i = 0; i < 100; i++) {
    const tree = h.render();
    if (nodes(tree).some(n => n.type === SeanceBilan) || source === 'REPCOUNT') return tree;
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  throw Error('Save did not settle');
}
async function main() {
  for (const source of ['PROGRAMME', 'REPCOUNT']) {
    const original = response(source);
    assert.equal(await parser.firstSavedConversionId(original, source), id);
    assert.equal((await original.json()).id, id, 'Optional parsing must not consume the caller response');
    for (const options of [
      { status: 500 }, { first: '0' }, { first: '' }, { body: 'not-json' },
      { body: {} }, { body: [] }, { body: { id: 'bad', source } },
      { body: { id, source: 'LIBRE' } },
    ]) assert.equal(await parser.firstSavedConversionId(response(source, options), source), null);
    assert.equal(await parser.firstSavedConversionId(response(source, { status: 200 }), source), id, 'Idempotent retry remains measurable');

    for (const options of [{}, { status: 200 }, { first: '0' }, { status: 500 }, { body: 'not-json' }]) {
      const h = harness(source, () => response(source, options));
      assert.equal(nodes(h.render()).filter(n => n.type === TrackConversion).length, 0, 'No event on opening');
      const tree = await save(h, source);
      const conversions = nodes(tree).filter(n => n.type === TrackConversion);
      const expected = options.first !== '0' && options.status !== 500 && options.body !== 'not-json';
      assert.equal(conversions.length, expected ? 1 : 0, JSON.stringify({ source, options }));
      if (expected) {
        assert.deepEqual(Object.keys(conversions[0].props).sort(), ['name', 'onceKey']);
        assert.equal(conversions[0].props.name, source === 'PROGRAMME' ? 'first_workout_completed' : 'first_repcount_saved');
        assert.equal(conversions[0].props.onceKey, id);
      }
      if (source === 'PROGRAMME') assert.equal(nodes(tree).find(n => n.type === SeanceBilan).props.sauvegardeErreur, options.status === 500);
      assert.equal(h.posts, 1);
    }
  }
  console.log('PASS real save handlers: server first flag + source + ID, 201/200, refusal, malformed body, no health payload, no event before save');
  console.log('LIMIT hooks/API simulated; run test-conversion-delivery.cjs for consent, late SDK and deduplication. No external receipt proven.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
