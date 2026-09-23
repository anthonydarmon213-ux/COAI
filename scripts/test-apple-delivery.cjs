const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const out = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/subscription/apple-delivery.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: out });
async function main() {
  const input = { userId: 'server-user', accountToken: 'ACCOUNT', signedTransaction: 'signed' };
  const facts = { transactionID: 'verified-id', accountToken: 'account', active: true };
  for (const failure of [null, 'verify', 'persist', 'readAccess']) {
    const calls = [];
    const deps = {
      verify: async (jws, token) => {
        calls.push('verify'); assert.equal(jws, 'signed'); assert.equal(token, 'ACCOUNT');
        if (failure === 'verify') throw Error('verify'); return facts;
      },
      persist: async (user, verified) => {
        calls.push('persist'); assert.equal(user, input.userId); assert.equal(verified, facts);
        if (failure === 'persist') throw Error('persist');
      },
      readAccess: async user => {
        calls.push('readAccess'); assert.equal(user, input.userId);
        if (failure === 'readAccess') throw Error('readAccess');
        return { subscribed: false, sources: { apple: false, stripe: false } };
      },
    };
    if (failure) await assert.rejects(out.deliverAppleTransaction(input, deps), new RegExp(failure));
    else {
      const ack = await out.deliverAppleTransaction(input, deps);
      assert.equal(ack.persisted, true); assert.equal(ack.transactionID, 'verified-id');
      assert.equal(ack.access.subscribed, false); // Ignore stale receipt.active.
    }
    assert.deepEqual(calls, ['verify', 'persist', 'readAccess'].slice(0, failure ? ['verify', 'persist', 'readAccess'].indexOf(failure) + 1 : 3));
  }
  await assert.rejects(out.deliverAppleTransaction(input, {
    verify: async () => ({ ...facts, accountToken: 'other-account' }),
    persist: async () => assert.fail('must not persist another account'),
    readAccess: async () => assert.fail('must not read another account'),
  }), /ACCOUNT_MISMATCH/);
  await assert.rejects(out.deliverAppleTransaction({ ...input, userId: '' }, {}), /CONTEXT_REQUIRED/);
  console.log('PASS: delivery ordering, failure propagation, account binding, stale/refunded access. Mock dependencies; not an Apple purchase test.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
