// Offline regression: render the real pages and shared layout, never call billing APIs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function load(file, dependencies = {}) {
  const box = { exports: {}, require: key => {
    if (key === 'react/jsx-runtime') return require(key);
    assert.ok(key in dependencies, `Unexpected dependency: ${key}`);
    return dependencies[key];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, box);
  return box.exports;
}
const layout = load('src/components/marketing/legal-page.tsx', {
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  '@/components/ui/section-label': load('src/components/ui/section-label.tsx'),
});
function render(page) {
  return renderToStaticMarkup(React.createElement(load(`src/app/(marketing)/${page}/page.tsx`, {
    '@/components/marketing/legal-page': layout,
  }).default));
}
const terms = render('cgv');
const privacy = render('confidentialite');
const catalogue = load('src/lib/subscription/apple-catalogue.ts').APPLE_ESSENTIEL_CATALOGUE;
for (const product of catalogue.products) {
  const price = (product.francePriceCents / 100).toLocaleString('fr-FR');
  assert.ok(terms.includes(`${price} €`), `Missing approved Apple reference price ${price}`);
}
for (const phrase of ['COAI Essentiel', 'Premium Remote', 'VIP Présentiel', 'Stripe', 'Apple', 'éligibilité est confirmée par Apple', 'prix effectivement applicable', 'devis']) {
  assert.ok(terms.includes(phrase), `Missing terms: ${phrase}`);
}
assert.ok(terms.includes('href="https://apps.apple.com/account/subscriptions"'));
assert.ok(terms.includes('ne résilie pas un abonnement Apple'));
assert.ok(!/Coaching Hybride|99€\/mois|200 € la séance|VIP à l&#x27;unité/.test(terms));
for (const phrase of ['Stripe', 'Apple', 'références de transaction', 'restauration', 'ne reçoit pas les numéros de carte bancaire']) {
  assert.ok(privacy.includes(phrase), `Missing privacy explanation: ${phrase}`);
}
assert.ok(terms.includes('28 septembre 2026'), 'Missing terms revision date');
assert.ok(privacy.includes('1er octobre 2026'), 'Missing privacy revision date');
for (const phrase of ['export des données de ton compte au format JSON', 'Il ne contient pas les fichiers photo', 'ni les données conservées séparément par les prestataires']) {
  assert.ok(privacy.includes(phrase), `Missing export scope explanation: ${phrase}`);
}
for (const html of [terms, privacy]) {
  assert.ok(html.includes('<main'));
  assert.ok(!html.includes('<script'));
}
console.log('PASS — rendered iOS legal pages: offers, Apple/Stripe, trial eligibility, management link, purchase data. Not a legal or production certification.');
