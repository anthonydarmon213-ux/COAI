const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function load(file, deps, globals = {}) {
  const box = { exports: {}, File, Blob, FormData, ...globals, require: key => {
    if (key === 'react/jsx-runtime') return require(key);
    assert.ok(key in deps, 'Unexpected dependency ' + key); return deps[key];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, box);
  return box.exports;
}
const consent = load('src/lib/ai/image-consent.ts', {});
const { AIImageConsent } = load('src/components/ai/image-consent.tsx', { react: React });
for (const scope of ['morphologie', 'montre', 'mouvement', 'repas', 'menu']) {
  assert.throws(() => consent.aiImageConsentHeaders(scope, false));
  assert.equal(consent.hasAIImageConsent(new Headers(), scope), false);
  const html = renderToStaticMarkup(React.createElement(AIImageConsent, { scope, agreed: false, onChange() {} }));
  assert.ok(html.includes('Anthropic') && html.includes('Facultatif') && html.includes('href="/confidentialite"'));
  assert.ok(html.includes('type="checkbox"') && !html.includes('checked=""'));
  assert.ok(html.includes('aria-describedby=') && html.includes('min-h-11'));
  assert.ok(!/jamais conserv|supprimée|aucune donnée/.test(html));
}
function walk(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props?.children).flatMap(child => walk(child, predicate))];
}
async function checkComponent(file, name, props, expectedScopes) {
  const state = [], refs = [], calls = [];
  let index = 0, refIndex = 0, prepared = 0;
  const stub = ({ children }) => React.createElement('div', null, children);
  const deps = {
    react: { ...React, useState: initial => {
      const i = index++;
      if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
    }, useRef: initial => {
      const i = refIndex++; refs[i] ??= { current: initial }; return refs[i];
    } },
    'next/navigation': { useRouter: () => ({ refresh() {} }) },
    '@/components/ai/image-consent': { AIImageConsent },
    '@/lib/ai/image-consent': consent,
    '@/lib/images/compress-progress-photo': { compressProgressPhoto: async file => { prepared++; return { file }; } },
  };
  for (const [module, exported] of [['button', 'Button'], ['input', 'Input'], ['textarea', 'Textarea'],
    ['field', 'Field'], ['card', 'Card'], ['section-label', 'SectionLabel'], ['select', 'Select']]) {
    deps['@/components/ui/' + module] = { [exported]: stub };
  }
  const component = load('src/components/' + file, deps, {
    fetch: async (url, options) => { calls.push({ url, options }); return Response.json({ error: 'Synthetic failure' }, { status: 503 }); },
    createImageBitmap: async () => { prepared++; return { width: 2, height: 2, close() {} }; },
    document: { createElement: () => ({ getContext: () => ({ drawImage() {} }), toBlob: callback => callback(new Blob(['x'], { type: 'image/jpeg' })) }) },
  })[name];
  function render() { index = 0; refIndex = 0; return component(props); }
  let tree = render();
  if (name === 'MotionCheck') {
    walk(tree, node => node.type === 'button')[0].props.onClick();
    tree = render();
  }
  assert.deepEqual(walk(tree, node => node.type === AIImageConsent).map(node => node.props.scope), expectedScopes);
  const fileFixture = new File(['synthetic-only-image'], 'fixture.png', { type: 'image/png' });
  const select = async input => {
    input.props.onChange({ target: { files: [fileFixture], value: '' } });
    await new Promise(resolve => setImmediate(resolve));
  };
  for (let i = 0; i < expectedScopes.length; i++) {
    tree = render();
    let control = walk(tree, node => node.type === AIImageConsent)[i];
    let input = walk(tree, node => node.type === 'input' && node.props.type === 'file')[i];
    assert.equal(control.props.agreed, false, file + ' initially unchecked');
    assert.equal(input.props.disabled, true, file + ' initially disabled');
    const before = calls.length, beforePreparation = prepared;
    await select(input); // Even a direct handler invocation must refuse.
    assert.equal(calls.length, before); assert.equal(prepared, beforePreparation);
    control.props.onChange(true);
    tree = render();
    control = walk(tree, node => node.type === AIImageConsent)[i];
    input = walk(tree, node => node.type === 'input' && node.props.type === 'file')[i];
    assert.equal(control.props.agreed, true); assert.equal(input.props.disabled, false);
    await select(input);
    assert.equal(calls.length, before + 1);
    assert.equal(consent.hasAIImageConsent(new Headers(calls.at(-1).options.headers), expectedScopes[i]), true);
    control.props.onChange(false);
    tree = render();
    await select(walk(tree, node => node.type === 'input' && node.props.type === 'file')[i]);
    assert.equal(calls.length, before + 1, file + ' withdrawal stops next upload');
  }
}
(async () => {
  for (const entry of [
    ['dashboard/watch-screenshot-cta.tsx', 'WatchScreenshotCta', {}, ['montre']],
    ['programme/analyse-photo-repas.tsx', 'AnalysePhotoRepas', {}, ['repas']],
    ['programme/menu-restaurant.tsx', 'MenuRestaurant', {}, ['menu']],
    ['programme/motion-check.tsx', 'MotionCheck', { nomExercice: 'Squat' }, ['mouvement']],
    ['compte/scan-morpho-posture.tsx', 'ScanMorphoPosture', {}, ['morphologie']],
    ['compte/profil-form.tsx', 'ProfilForm', { profil: {} }, ['montre', 'morphologie']],
  ]) await checkComponent(...entry);
  console.log('PASS — seven UI entry points: default refusal, no preparation/upload without consent, scoped acknowledgement, withdrawal; rendered disclosure. React state/browser/providers simulated.');
})().catch(error => { console.error(error); process.exitCode = 1; });
