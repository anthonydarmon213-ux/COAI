const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let states, cursor, calls, navigations, response;
const deadlineBox = { exports: {}, AbortController, setTimeout, clearTimeout };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/suivi/request-deadline.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, deadlineBox);
const router = { refresh: () => navigations.push('refresh'), replace: url => navigations.push(url) };
const box = { exports: {}, Error, fetch: async (url, options) => {
  calls.push([url, options.method]);
  if (response === 'timeout') return new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' }))));
  if (response === 'body-timeout') return { ok: true, json: () => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' })))) };
  return response;
}, require: name => {
  if (name.includes('request-deadline')) return { withRequestDeadline: operation => deadlineBox.exports.withRequestDeadline(operation, 10) };
  if (name === 'react') return { useState: initial => {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], next => { states[index] = next; }];
  }, useRef: initial => {
    const index = cursor++;
    if (!(index in states)) states[index] = { current: initial };
    return states[index];
  } };
  if (name === 'next/navigation') return { useRouter: () => router };
  if (name.startsWith('@/')) return new Proxy({}, { get: () => 'button' });
  return require(name);
} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/programme/regenerate-button.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, box);
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function render(hasExisting) { cursor = 0; return nodes(box.exports.RegenerateButton({ hasExisting })); }
const complete = { echecs: 0, programmes: ['ENTRAINEMENT', 'NUTRITION', 'RECUPERATION'].map(pilier => ({ id: pilier, pilier, statut: 'GENERE_IA' })) };
function reset(result = complete, ok = true) {
  states = []; calls = []; navigations = [];
  response = { ok, json: async () => result };
}
(async () => {
  reset();
  await render(false).find(n => n.props?.children === 'Créer mon programme complet').props.onClick();
  assert.deepEqual(calls, [['/api/programmes/generate?mode=onboarding', 'POST']]);
  assert.deepEqual(navigations, ['/programme/entrainement?onboarding=1#seance-du-jour', 'refresh']);
  reset();
  await render(true).find(n => n.props?.children === 'Recréer mes 3 piliers').props.onClick();
  assert.equal(calls.length, 0, 'Existing versions require confirmation');
  await render(true).find(n => n.props?.children === 'Oui, recréer les 3 piliers').props.onClick();
  assert.deepEqual(calls, [['/api/programmes/generate', 'POST']]);
  assert.deepEqual(navigations, ['refresh']);
  for (const [body, ok] of [[{ error: 'Relecture requise' }, false], [{ echecs: 1 }, true]]) {
    reset(body, ok);
    await render(false).find(n => n.props?.children === 'Créer mon programme complet').props.onClick();
    assert.deepEqual(navigations, [], 'Failure must not announce a ready workout');
    assert(render(false).some(n => n.props?.children === 'Créer mon programme complet' && !n.props.disabled));
  }
  for (const malformed of [null, {}, { echecs: 0 }, { ...complete, programmes: [] },
    { ...complete, programmes: complete.programmes.slice(0, 2) },
    { ...complete, programmes: [complete.programmes[0], complete.programmes[0], complete.programmes[2]] },
    { ...complete, programmes: complete.programmes.map(p => ({ ...p, statut: 'REJETE' })) }]) {
    reset(malformed);
    await render(false).find(n => n.props?.children === 'Créer mon programme complet').props.onClick();
    assert.deepEqual(navigations, [], 'Unconfirmed pillars must not announce a ready workout');
  }
  for (const fault of ['timeout', 'body-timeout']) {
    reset(); response = fault;
    const submit = render(false).find(n => n.props?.children === 'Créer mon programme complet').props.onClick;
    await Promise.all([submit(), submit()]);
    assert.equal(calls.length, 1, 'Double tap must not send concurrent writes');
    assert.deepEqual(navigations, []);
    const retry = render(false).find(n => n.props?.children === 'Créer mon programme complet');
    assert(!retry.props.disabled);
    assert(render(false).some(n => n.props?.role === 'alert' && n.props.children.includes('trop de temps')));
    response = { ok: true, json: async () => complete };
    await retry.props.onClick();
    assert.equal(calls.length, 2);
    assert.equal(navigations[0], '/programme/entrainement?onboarding=1#seance-du-jour');
  }
  reset({});
  await render(false).find(n => n.props?.children === 'Créer mon programme complet').props.onClick();
  await render(false).find(n => n.props?.children === 'Vérifier mon programme').props.onClick();
  assert.equal(calls.length, 1, 'Checking an uncertain programme must not submit another creation');
  assert.deepEqual(navigations, ['/programme/entrainement?onboarding=1#seance-du-jour', 'refresh']);
  console.log('PASS real creation handler: resumable first request, first-session navigation, explicit recreation confirmation, failure stays recoverable.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
