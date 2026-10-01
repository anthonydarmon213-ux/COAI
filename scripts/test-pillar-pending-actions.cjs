// Real server-component markup; database, access and child components are isolated.
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const assert = require('node:assert/strict');
const { renderToStaticMarkup } = require('react-dom/server');
const passthrough = ({ children }) => React.createElement('div', null, children);
const mocks = {
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  'next/image': { __esModule: true, default: () => null },
  '@/lib/auth/server': { getCurrentAppUser: async () => ({ id: 'fixture', profile: {} }) },
  '@/lib/db/client': { prisma: {
    programmeGenerated: { findFirst: async ({ where }) => where.statut ? null : { statut: 'EN_ATTENTE', contenu: { secret: 'UNREVIEWED_CONTENT' }, version: 2 } },
    dailySession: { findMany: async () => [] },
  } },
  '@/lib/subscription/content-access': { contentAccessFor: async () => ({ programme: true, plan: 'PREMIUM' }) },
  '@/lib/programmes/access': { accessibleTraining: () => null },
  '@/lib/server/request-time': { requestTime: () => Date.now() },
  '@/lib/whatsapp': { buildWhatsAppLink: () => null },
  '@/lib/insight/score-sommeil': { calculerScoreSommeil: () => null },
};
const file = 'src/components/programme/pilier-page.tsx';
const box = { exports: {}, require: name => mocks[name] || (name.startsWith('@/') ? new Proxy({}, { get: () => passthrough }) : require(name)) };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022,
} }).outputText, box);
(async () => {
  for (const [pilier, href, label] of [
    ['NUTRITION', '/programme/recettes', 'Explorer les recettes'],
    ['RECUPERATION', '/dashboard#check-in-du-jour', 'Faire mon bilan sommeil et forme'],
    ['ENTRAINEMENT', '/programme/exercices', 'Voir les exercices et leurs vidéos'],
  ]) {
    const html = renderToStaticMarkup(await box.exports.PilierPage({ pilierActif: pilier }));
    assert.ok(html.includes(`href="${href}"`));
    assert.ok(html.indexOf(label) >= 0 && html.indexOf(label) < html.indexOf('Choisir un pilier'));
    assert.ok(html.includes('Programme en attente de validation'));
    assert.ok(!html.includes('Télécharger ma fiche (PDF)'));
    assert.ok(!html.includes('UNREVIEWED_CONTENT'));
  }
  console.log('PASS: three pending pillars expose early actions without releasing unreviewed content or PDF.');
})().catch(error => { console.error(error); process.exitCode = 1; });
