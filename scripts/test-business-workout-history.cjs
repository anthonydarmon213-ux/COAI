// Execute the actual page queries/calculations; DB is deliberately mocked.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/app/admin/business/page.tsx', 'utf8');
const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = new Map();
function walk(node) {
  if (ts.isVariableDeclaration(node)) declarations.set(node.name.getText(ast), node.initializer);
  ts.forEachChild(node, walk);
}
walk(ast);
const compile = text => ts.transpileModule(text, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
function expression(node, context = {}) {
  return vm.runInNewContext(compile(`result = (${node.getText(ast)});`), context);
}
const queries = declarations.get([...declarations.keys()].find(key => key.startsWith('[totalUsers,'))).expression.arguments[0].elements;
const date = value => new Date(value);
(async () => {
  let completedFilterSeen = false;
  const total = await expression(queries[3], { prisma: {
    seanceLog: { count: async () => 2 },
    dailySession: { count: async args => {
      assert.equal(JSON.stringify(args), JSON.stringify({ where: { completedAt: { not: null } } }));
      completedFilterSeen = true; return 3;
    } },
  } });
  assert.equal(total, 5); assert(completedFilterSeen);
  await expression(queries[1], { prisma: { subscription: { findMany: async args => {
    assert.equal(args.select.user.select._count.select.dailySessions.where.completedAt.not, null);
    return [];
  } } } });
  await expression(queries[12], { prisma: { user: { findMany: async args => {
    const daily = args.select.dailySessions;
    assert.equal(daily.where.completedAt.not, null);
    assert.equal(daily.orderBy.completedAt, 'asc'); assert.equal(daily.take, 1);
    assert.equal(daily.select.completedAt, true); return [];
  } } } });
  const active = expression(declarations.get('essaisAvecSeance'), { essaisActifs: [
    { user: { _count: { seances: 0, dailySessions: 1 } } },
    { user: { _count: { seances: 1, dailySessions: 2 } } },
    { user: { _count: { seances: 0, dailySessions: 0 } } },
  ] });
  assert.equal(active, 2, 'A member is counted once even with both histories');
  const first = expression(declarations.get('premiereValeurDe'));
  assert.equal(first({ seances: [], testsMaxi: [], dailySessions: [] }), null);
  const daily = date('2026-09-25T10:00:00Z');
  assert.equal(first({ seances: [], testsMaxi: [], dailySessions: [{ completedAt: daily }] }), daily);
  const earlier = date('2026-09-24T10:00:00Z');
  assert.equal(first({ seances: [], testsMaxi: [{ createdAt: earlier }], dailySessions: [{ completedAt: daily }] }), earlier);
  console.log('PASS: actual admin queries include only completed daily sessions; totals, unique active members and earliest activation handle both sources. Mocked DB, not production proof.');
})().catch(error => { console.error(error); process.exitCode = 1; });
