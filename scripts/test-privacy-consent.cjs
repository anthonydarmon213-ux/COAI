const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const memory = new Map();
const calls = [];
const document = { cookie: '' };
const window = {
  localStorage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) },
  dispatchEvent: event => calls.push(event.type),
  location: { search: '?utm_source=test' },
  gtag: (...args) => calls.push(args), fbq: (...args) => calls.push(args),
};
function load(file, deps = {}, globals = { window, document }) {
  const box = { exports: {}, Date, Event, URLSearchParams, ...globals, require: key => {
    assert.ok(key in deps, key); return deps[key];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, box);
  return box.exports;
}
const consent = load('src/lib/analytics/consent.ts');
const analytics = load('src/lib/analytics.ts', { './analytics/consent': consent });
const utm = load('src/lib/attribution/utm-cookie.ts', { '../analytics/consent': consent });
assert.equal(load('src/lib/analytics/consent.ts', {}, {}).hasConsent('audience'), false, 'SSR fails closed');
assert.equal(consent.readConsent(), null);
assert.equal(analytics.trackEvent('test'), false);
utm.captureUtmFromLocation(); assert.equal(document.cookie, '');
consent.saveConsent({ audience: true, marketing: false });
assert.equal(analytics.trackEvent('test'), true);
assert.equal(analytics.trackMetaEvent('test'), false);
utm.storeUtmCookie({ utmSource: 'test' }); assert.equal(document.cookie, '');
consent.saveConsent({ audience: false, marketing: true });
assert.equal(analytics.trackEvent('test'), false);
assert.equal(analytics.trackMetaEvent('test'), true);
utm.captureUtmFromLocation(); assert.ok(document.cookie.startsWith('coai_utm='));
assert.equal(utm.readUtmCookie().utmSource, 'test');
consent.saveConsent(consent.REFUSE_ALL);
assert.equal(utm.readUtmCookie(), null, 'Old attribution cannot be used after refusal');
utm.clearUtmCookie(); assert.ok(document.cookie.includes('max-age=0'));
for (const value of ['broken', '{"version":1,"audience":true,"marketing":true,"expiresAt":1e309}', '{"version":1,"audience":true,"marketing":true,"expiresAt":-1e309}', JSON.stringify({ version: 1, audience: true, marketing: true, expiresAt: Date.now() - 1 }), JSON.stringify({ version: 1, audience: 'true', marketing: true, expiresAt: Date.now() + 10000 })]) {
  memory.set(consent.CONSENT_KEY, value);
  assert.equal(consent.readConsent(), null);
  assert.equal(analytics.trackEvent('invalid-consent'), false);
  assert.equal(analytics.trackMetaEvent('invalid-consent'), false);
  document.cookie = '';
  utm.captureUtmFromLocation();
  assert.equal(document.cookie, '', 'Invalid consent must not enable campaign attribution');
}
window.localStorage.getItem = () => { throw Error('storage blocked'); };
window.localStorage.setItem = () => { throw Error('storage blocked'); };
assert.equal(consent.hasConsent('marketing'), false);
assert.equal(consent.saveConsent(consent.REFUSE_ALL), false);
assert.equal(analytics.trackMetaEvent('test'), false);
// Render the actual client boundary on the server: no optional scripts or pixel.
const React = require('react');
let pathname = '/sign-in';
const dependencies = {
  react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
  'next/navigation': { usePathname: () => pathname },
  '@vercel/analytics/next': { Analytics: () => React.createElement('script', { src: 'vercel-tracker' }) },
  './google-analytics': { GoogleAnalytics: () => React.createElement('script', { src: 'google-tracker' }) },
  './meta-pixel': { MetaPixel: () => React.createElement('script', { src: 'meta-tracker' }) },
  '@/lib/analytics/consent': consent, '@/lib/attribution/utm-cookie': utm,
  '@/lib/analytics/production-origin': load('src/lib/analytics/production-origin.ts'),
};
const component = load('src/components/analytics/privacy-controls.tsx', dependencies, {});
// Closing an existing preference panel must discard draft changes, not save consent.
const storedChoice = { audience: false, marketing: false };
let closeState = [storedChoice, { audience: true, marketing: true }, true, true, false];
let closeIndex = 0, savedByClose = 0;
const closeComponent = load('src/components/analytics/privacy-controls.tsx', {
  ...dependencies,
  react: { ...React, useEffect: () => {}, useRef: initial => ({ current: initial }),
    useState: () => { const i = closeIndex++; return [closeState[i], value => { closeState[i] = value; }]; } },
  '@/lib/analytics/consent': { ...consent, saveConsent: () => { savedByClose++; } },
}, {});
function findClose(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'button' && node.props.children === 'Fermer') return node;
  return React.Children.toArray(node.props?.children).map(findClose).find(Boolean);
}
findClose(closeComponent.PrivacyControls()).props.onClick();
assert.equal(closeState[2], false);
assert.equal(closeState[1], storedChoice);
assert.equal(savedByClose, 0);
const html = require('react-dom/server').renderToStaticMarkup(React.createElement(component.PrivacyControls));
assert.ok(!html.includes('<script') && !html.includes('<img'));
// Render the actual open panel with no choice. Only its placement changes;
// authentication is not consent and must not mount optional trackers.
for (const route of ['/sign-in', '/sign-up', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe', '/bienvenue', '/', '/dashboard']) {
  pathname = route;
  let stateIndex = 0;
  const openPanel = load('src/components/analytics/privacy-controls.tsx', {
    ...dependencies,
    react: { ...React, useState: initial => [stateIndex++ === 2 ? true : initial, () => {}] },
  }, {});
  const markup = require('react-dom/server').renderToStaticMarkup(React.createElement(openPanel.PrivacyControls));
  const sectionClass = markup.match(/<section[^>]*class="([^"]+)"/)[1];
  const auth = !['/', '/dashboard'].includes(route);
  assert.equal(sectionClass.split(' ').includes('fixed'), !auth, route);
  assert.equal(sectionClass.split(' ').includes('relative'), auth, route);
  assert.ok(markup.includes('Tout refuser') && markup.includes('Tout accepter') && markup.includes('Personnaliser'));
  assert.ok(!markup.includes('<script') && !markup.includes('<img'), route + ' fails closed');
}
assert.ok(!fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8').includes('MicrosoftClarity'));
// Even with full consent and configured trackers, local/preview visits must
// never pollute the production analytics. Render the actual mounting boundary.
for (const [hostname, protocol, expected] of [
  ['coai.fr', 'https:', true], ['www.coai.fr', 'https:', true],
  ['coai.fr', 'http:', false], ['localhost', 'http:', false],
  ['127.0.0.1', 'http:', false], ['lab-coach.vercel.app', 'https:', false],
  ['coai.fr.example.com', 'https:', false], ['example.com', 'https:', false],
]) {
  const origin = load('src/lib/analytics/production-origin.ts', {}, { window: { location: { hostname, protocol } } });
  assert.equal(origin.isProductionAnalyticsOrigin(), expected, hostname + protocol);
  let stateIndex = 0;
  const mounted = load('src/components/analytics/privacy-controls.tsx', {
    ...dependencies,
    '@/lib/analytics/production-origin': origin,
    react: { ...React, useState: initial => [stateIndex++ === 0 ? { audience: true, marketing: true } : initial, () => {}] },
  }, {});
  const markup = require('react-dom/server').renderToStaticMarkup(React.createElement(mounted.PrivacyControls));
  for (const tracker of ['google-tracker', 'meta-tracker', 'vercel-tracker']) {
    assert.equal(markup.includes(tracker), expected, hostname + ': ' + tracker);
  }
}
assert.equal(load('src/lib/analytics/production-origin.ts', {}, {}).isProductionAnalyticsOrigin(), false);
// Native iOS never translates an old website cookie choice into ATT consent.
window.localStorage.getItem = key => memory.get(key) ?? null;
window.localStorage.setItem = (key, value) => memory.set(key, value);
const accepted = JSON.stringify({ version: 1, audience: true, marketing: true, expiresAt: Date.now() + 100000 });
memory.set(consent.CONSENT_KEY, accepted);
for (const agent of ['Mozilla/5.0 Mobile COAIiOS/1', 'Mozilla/5.0 COAIiOS/22 Test']) {
  window.navigator = { userAgent: agent };
  assert.equal(consent.isNativeIOSApp(), true);
  assert.equal(consent.hasConsent('audience'), false);
  assert.equal(consent.hasConsent('marketing'), false);
  assert.equal(analytics.trackEvent('native-test'), false);
  assert.equal(analytics.trackMetaEvent('native-test'), false);
  assert.equal(consent.saveConsent({ audience: true, marketing: true }), false);
  assert.equal(memory.get(consent.CONSENT_KEY), accepted, 'Native must not overwrite website preferences');
  document.cookie = '';
  utm.captureUtmFromLocation(); assert.equal(document.cookie, '');
  // Even a stale React state containing both acceptances cannot mount a tracker.
  for (const nativeState of [false, true]) {
    let index = 0;
    const native = load('src/components/analytics/privacy-controls.tsx', {
      ...dependencies,
      '@/lib/analytics/production-origin': { isProductionAnalyticsOrigin: () => true },
      react: { ...React, useState: initial => {
        const i = index++;
        return [i === 0 ? { audience: true, marketing: true } : i === 5 ? nativeState : initial, () => {}];
      } },
    }, {});
    const markup = require('react-dom/server').renderToStaticMarkup(React.createElement(native.PrivacyControls));
    assert.ok(!markup.includes('<script') && !markup.includes('<img'));
    if (nativeState) {
      assert.ok(markup.includes('désactivés dans cette version iPhone'));
      assert.ok(!markup.includes('Tout accepter') && !markup.includes('Tout refuser'));
    }
  }
}
for (const agent of ['', 'Mozilla/5.0 iPhone Safari/604.1', 'notCOAIiOS/1', 'COAIiOS/1evil']) {
  window.navigator = { userAgent: agent };
  assert.equal(consent.isNativeIOSApp(), false);
  assert.equal(consent.hasConsent('marketing'), true, 'Normal browser choices unchanged');
}
console.log('PASS privacy: SSR, purpose separation, refusal, expiry, malformed/blocked storage, UTM gating, no Clarity mount');
console.log('PASS native privacy: no analytics, Meta or UTM despite stored acceptance; SSR and website unchanged');
