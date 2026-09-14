const fs = require('fs');
const ts = require('typescript');
const vm = require('vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const assert = require('node:assert/strict');
const source = fs.readFileSync('src/app/(app)/club/page.tsx', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
} }).outputText;
const loaded = { exports: {} };
vm.runInNewContext(code, {
  module: loaded, exports: loaded.exports,
  require: (name) => name === 'next/link'
    ? { default: (props) => React.createElement('a', props) }
    : name === '@/lib/whatsapp'
      ? { buildWhatsAppLink: (message) => 'https://wa.me/33678989640?text=' + encodeURIComponent(message) }
      : require(name),
});
const html = renderToStaticMarkup(React.createElement(loaded.exports.default));
for (const text of ['Le Direct du Coach.', 'Sans replay', 'Premier rendez-vous en préparation.',
  'Préparer ma question sur WhatsApp', 'Run &amp; café']) assert(html.includes(text), text);
assert(!html.includes('<main'), 'Le layout fournit déjà main');
assert(html.includes('<details'));
assert(html.includes('target="_blank"'));
assert(html.includes('rel="noreferrer"'));
assert(html.includes(encodeURIComponent('Bonjour Anthony, voici ma question pour le prochain Direct du Coach COAI : ')));
console.log('Club : rendu, état en préparation, question explicite, rencontres conservées — OK');
