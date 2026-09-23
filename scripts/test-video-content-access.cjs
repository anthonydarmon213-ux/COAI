const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/app/(app)/videos/page.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
async function scenario(access, anonymous = false) {
  const exports = {}, calls = [];
  const jsx = (type, props) => ({ type, props });
  const modules = {
    'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'Link' },
    '@/lib/auth/server': { getCurrentAppUser: async () => anonymous ? null : { id: 'verified-user' } },
    '@/components/auth/access-recovery': { AccessRecovery: 'AccessRecovery' },
    '@/lib/subscription/content-access': { contentAccessFor: async user => { assert.equal(user.id, 'verified-user'); return access; } },
    '@/lib/db/client': { prisma: { video: {
      findMany: async query => {
        calls.push(query);
        const common = { id: 'video', titre: 'Test', categorie: null, youtubeIdApercu: 'PUBLIC_PREVIEW' };
        if (query.select) { assert.equal(query.select.youtubeId, undefined); return [common]; }
        return [{ ...common, youtubeId: 'MEMBER_VIDEO' }];
      }, count: async () => 1,
    } } },
  };
  for (const [file, symbol] of [['card', 'Card'], ['badge', 'Badge'], ['button', 'Button'], ['section-label', 'SectionLabel']]) modules['@/components/ui/' + file] = { [symbol]: symbol };
  vm.runInNewContext(code, { exports, require: name => { assert(Object.hasOwn(modules, name), name); return modules[name]; } });
  if (access.appleUnavailable && !access.programme && !anonymous) {
    await assert.rejects(exports.default(), /indisponible/); assert.equal(calls.length, 0); return;
  }
  const tree = await exports.default();
  if (anonymous) { assert.equal(tree.type, 'AccessRecovery'); assert.equal(calls.length, 0); return; }
  assert.equal(calls.length, 1);
  const serialized = JSON.stringify(tree);
  assert.equal(serialized.includes('MEMBER_VIDEO'), access.programme);
  if (!access.programme) assert(serialized.includes('PUBLIC_PREVIEW'));
}
(async () => {
  await scenario({ programme: true, appleUnavailable: false });
  await scenario({ programme: false, appleUnavailable: false });
  await scenario({ programme: false, appleUnavailable: true });
  await scenario({ programme: true, appleUnavailable: true }); // Historical right survives.
  await scenario({ programme: false, appleUnavailable: false }, true);
  console.log('PASS: real video page control flow; private IDs absent without rights, outage before query, historical access and anonymous recovery. Dependencies mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
