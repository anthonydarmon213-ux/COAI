const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let access = true, existing = null;
const passthrough = ({ children }) => React.createElement('div', null, children);
const mocks = {
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  'next/image': { __esModule: true, default: () => null },
  '@/lib/auth/server': { getCurrentAppUser: async () => ({ id: 'fixture', profile: {} }) },
  '@/lib/db/client': { prisma: { programmeGenerated: { findFirst: async ({ where }) => where.statut ? null : existing }, dailySession: { findMany: async () => [] } } },
  '@/lib/subscription/content-access': { contentAccessFor: async () => ({ programme: access, plan: 'PREMIUM' }) },
  '@/lib/programmes/access': { accessibleTraining: () => null },
  '@/lib/server/request-time': { requestTime: () => Date.now() },
  '@/lib/whatsapp': { buildWhatsAppLink: () => null },
  '@/lib/insight/score-sommeil': { calculerScoreSommeil: () => null },
  '@/components/programme/regenerate-button': { RegenerateButton: ({ hasExisting }) => React.createElement('button', null, hasExisting ? 'RECREATE' : 'FIRST_CREATE') },
};
const box = { exports: {}, require: name => mocks[name] || (name.startsWith('@/') ? new Proxy({}, { get: () => passthrough }) : require(name)) };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/programme/pilier-page.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText, box);
(async () => {
  for (const pilierActif of ['ENTRAINEMENT', 'NUTRITION', 'RECUPERATION']) {
    access = true; existing = null;
    const html = renderToStaticMarkup(await box.exports.PilierPage({ pilierActif }));
    assert.equal(html.split('FIRST_CREATE').length - 1, 1);
    assert(html.indexOf('FIRST_CREATE') < html.indexOf('Choisir un pilier'), 'First creation must precede secondary navigation');
    assert(!html.includes('Ajustements avancés du programme'), 'An empty programme is not an advanced adjustment');
    access = false;
    assert(!renderToStaticMarkup(await box.exports.PilierPage({ pilierActif })).includes('FIRST_CREATE'));
    access = true; existing = { statut: 'EN_ATTENTE', contenu: {}, version: 1 };
    assert(!renderToStaticMarkup(await box.exports.PilierPage({ pilierActif })).includes('FIRST_CREATE'));
  }
  console.log('PASS first programme action is early, unique and access-gated; pending review is not bypassed.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
