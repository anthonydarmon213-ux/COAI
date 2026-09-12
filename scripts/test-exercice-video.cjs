// Render the real component without a browser or paid services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, ...args);
};
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
      fileName: filename,
    });
    module._compile(outputText, filename);
  };
}
const { ExerciceVideo } = require('../src/components/programme/exercice-video.tsx');
for (const [nom, fichier] of [
  ['Tirage horizontal (machine)', 'tirage-horizontal'],
  ['Développé incliné à la machine', 'developpe-incline-machine'],
]) {
  const html = renderToStaticMarkup(React.createElement(ExerciceVideo, { nom }));
  assert.match(html, /<video\b/);
  assert.match(html, /controls=""/);
  assert.match(html, /playsinline=""/);
  assert.match(html, /preload="none"/);
  assert.ok(html.includes(`/videos/exercices/${fichier}.mp4`));
  assert.doesNotMatch(html, /autoplay|<button|<img/);
  assert.ok(fs.existsSync(path.join(root, 'public/videos/exercices', `${fichier}.mp4`)));
}
assert.equal(renderToStaticMarkup(React.createElement(ExerciceVideo, { nom: 'Exercice inconnu de test' })), '');
console.log('PASS: native video SSR, manual playback, exact sources, no invisible overlay, unknown exercise hidden');
