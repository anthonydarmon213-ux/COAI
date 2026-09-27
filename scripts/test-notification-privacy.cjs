const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('src/lib/email/client.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function scenario(mode, env = {}) {
  const calls = [], logs = [];
  const context = {
    exports: {}, process: { env: { RESEND_API_KEY: 'fake-key', ADMIN_NOTIFICATION_EMAIL: 'coach@example.test', NTFY_TOPIC: 'private-topic', ...env } },
    console: { error: (...args) => logs.push(args), warn: (...args) => logs.push(args) },
    fetch: async (url, init) => {
      calls.push({ url, ...init });
      if (mode === 'throw') throw Error('SECRET personal content private-topic fake-key');
      return { ok: mode === 'ok', status: 503, text: async () => { throw Error('provider body must not be read'); } };
    },
  };
  vm.runInNewContext(source, context);
  await context.exports.sendAdminNotification('SECRET Alice alice@example.test', 'SECRET health detail', '<b>SECRET health detail</b>');
  return { calls, logs };
}

(async () => {
  const { calls } = await scenario('ok');
  assert.equal(calls.length, 2);
  const push = calls.find(call => call.url.includes('ntfy.sh'));
  assert(push);
  assert(!JSON.stringify(push).includes('SECRET'));
  assert.match(push.body, /notification COAI/);
  const email = JSON.parse(calls.find(call => call.url.includes('resend.com')).body);
  assert.equal(email.subject, 'SECRET Alice alice@example.test');
  assert.equal(email.text, 'SECRET health detail');
  assert.equal(email.html, '<b>SECRET health detail</b>');
  for (const mode of ['error', 'throw']) {
    const result = await scenario(mode);
    assert.equal(result.calls.length, 2, 'both channels attempted independently');
    assert(!/SECRET|private-topic|fake-key/.test(JSON.stringify(result.logs)));
  }
  assert.equal((await scenario('ok', { NTFY_TOPIC: '' })).calls.length, 1);
  const onlyPush = await scenario('ok', { RESEND_API_KEY: '' });
  assert.equal(onlyPush.calls.length, 1);
  assert(!JSON.stringify(onlyPush.calls[0]).includes('SECRET'));
  console.log('PASS notifications: generic push, unchanged email, no provider payload/secrets in failure logs, optional channels');
})().catch(error => { console.error(error); process.exitCode = 1; });
