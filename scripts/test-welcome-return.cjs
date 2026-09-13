// Actual server page rendered with simulated auth/Stripe. No network or writes.
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let session = null, fail = false, paid = false;
const deps = {
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  '@/lib/auth/server': { getCurrentAppUser: async () => ({ id: 'owner', prenom: 'Test', subscription: null }) },
  '@/components/ui/section-label': { SectionLabel: ({children}) => React.createElement('span', null, children) },
  '@/components/ui/button': { Button: () => null },
  '@/components/analytics/track-conversion': { TrackConversion: () => React.createElement('span', null, 'CONVERSION') },
  '@/components/onboarding/activation-flow': { ActivationFlow: () => React.createElement('span', null, 'ACTIVATION') },
  '@/lib/subscription/plan': { hasPaidSubscription: () => paid },
  '@/lib/stripe/client': { stripe: { checkout: { sessions: { retrieve: async () => {
    if (fail) throw Error('simulated outage');
    return session;
  } } } } },
};
const box = { exports: {}, Date, Boolean, encodeURIComponent, console: {error() {}}, require: name => {
  assert(name in deps, name); return deps[name];
} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/(app)/bienvenue/page.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
const render = async searchParams => renderToStaticMarkup(await box.exports.default({searchParams}));
(async () => {
  for (const fixture of [null, {status:'open'}, {status:'expired'}, {status:'complete', mode:'payment'},
    {status:'complete', mode:'subscription', client_reference_id:'other'}]) {
    session = fixture;
    for (paid of [false, true]) {
      const html = await render({session_id:'cs_fixture', plan:'PASS_IA'});
      assert(html.includes('Confirmation à vérifier'));
      assert(!html.includes('ACTIVATION')); assert(!html.includes('CONVERSION'));
      assert(!html.includes('Compte créé')); assert(html.includes('/compte/abonnement'));
    }
  }
  fail = true;
  assert((await render({session_id:'cs_fixture'})).includes('Réessayer la vérification'));
  fail = false; paid = false;
  for (const session_id of ['', 'invalid', 'x&plan=PREMIUM']) {
    const html = await render({session_id});
    assert(html.includes('Confirmation à vérifier'));
    assert(html.includes(`session_id=${encodeURIComponent(session_id)}`));
  }
  assert((await render({})).includes('Compte créé'));
  session = {id:'cs_fixture', status:'complete', mode:'subscription', client_reference_id:'owner'};
  const valid = await render({session_id:'cs_fixture'});
  assert(valid.includes('ACTIVATION')); assert(valid.includes('CONVERSION'));
  console.log('PASS: unverified/malformed returns and Stripe failure get recovery actions, even for paid accounts; free and verified paths preserved. Simulated providers only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
