const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let auth = null, user = null, rows = [], reads = 0;
const moduleExports = {};
class ImageCapture {
  constructor(element, options) { this.element = element; this.options = options; }
}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/suivi/bilan-mensuel/carte/route.tsx', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX}
}).outputText, {exports: moduleExports, require(name) {
  if (name === 'react/jsx-runtime') return require(name);
  if (name === 'next/og') return {ImageResponse: ImageCapture};
  if (name === 'next/server') return {NextResponse: {json: (body, options) => ({body, ...options})}};
  if (name === '@/lib/auth/server') return {getCurrentUser: async () => auth};
  if (name === '@/lib/db/client') return {prisma: {user: {findUnique: async args => {
    reads++; assert.equal(args.where.supabaseAuthId, 'auth-member'); return user;
  }}}};
  if (name === '@/lib/suivi/workout-history') return {workoutHistory: async (id, options) => {
    reads++; assert.equal(id, 'member'); assert.equal(options.order, 'asc');
    assert(Math.abs(options.from.getTime() - (Date.now() - 30 * 86400000)) < 2000);
    return rows;
  }};
  throw Error(name);
}});
(async () => {
  assert.equal((await moduleExports.GET()).status, 401); assert.equal(reads, 0);
  auth = {id: 'auth-member'};
  assert.equal((await moduleExports.GET()).status, 404); assert.equal(reads, 1);
  user = {id: 'member'};
  assert.equal((await moduleExports.GET()).status, 404);
  rows = [{id: 'daily:completed', date: new Date()}];
  const result = await moduleExports.GET();
  assert(result instanceof ImageCapture);
  assert.match(result.options.headers['cache-control'], /private, no-store/);
  const tree = JSON.stringify(result.element);
  assert.match(tree, /SÉANCE/); assert(!tree.includes('daily:completed'));
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    nodes.push(node); visit(node.props?.children);
  }
  visit(result.element);
  assert.equal(nodes.find(node => node.props?.style?.fontSize === 190)?.props.children, 1);
  // Render the actual React tree with Next's PNG renderer, not the captured response.
  const png = new (require('next/og').ImageResponse)(result.element, result.options);
  const bytes = Buffer.from(await png.arrayBuffer());
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert(bytes.length > 1000);
  console.log('PASS monthly card: unauthenticated/missing/empty, daily-only history, private response and real PNG rendering. Auth/database mocked.');
})().catch(error => {console.error(error); process.exitCode = 1;});
