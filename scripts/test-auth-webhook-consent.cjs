// Real handler, synthetic webhook and database. No external services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/app/api/webhooks/supabase/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
let writes = 0;
const box = { exports: {}, process: { env: { SUPABASE_WEBHOOK_SECRET: 'local-test-only' } },
  require: key => {
    if (key === 'next/server') return { NextResponse: { json: (body, options) => Response.json(body, options) } };
    if (key === 'zod') return require('zod');
    if (key === '@/lib/db/client') return { prisma: { user: { upsert: async () => { writes++; } } } };
    throw new Error(key);
  } };
vm.runInNewContext(source, box);
const payload = { type: 'INSERT', schema: 'auth', table: 'users', record: {
  id: 'b0a6a7af-047c-43cf-a503-3cfd3241487b', email: 'test@example.test',
  raw_user_meta_data: { consentRgpd: true, consentSante: true },
} };
async function call(body, secret = 'local-test-only') {
  return box.exports.POST(new Request('http://localhost/api/webhooks/supabase', {
    method: 'POST', headers: { 'x-webhook-secret': secret }, body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
}
(async () => {
  assert.equal((await call(payload, 'wrong')).status, 401);
  assert.equal((await call(payload)).status, 200);
  assert.equal(writes, 0, 'An Auth INSERT must not manufacture consent or finalize an application account');
  assert.equal((await call('{')).status, 400);
  assert.equal((await call(null)).status, 400);
  assert.equal((await call({ ...payload, schema: 'public' })).status, 200);
  assert.equal((await call({ ...payload, type: 'UPDATE' })).status, 200);
  assert.equal((await call(payload)).status, 200);
  assert.equal(writes, 0, 'Repeated events and editable metadata must never create consent');
  console.log('PASS Auth webhook: authenticated acknowledgement only, malformed payloads rejected, no account or consent writes.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
