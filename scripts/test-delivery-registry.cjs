const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { pathToFileURL } = require('node:url');
(async () => {
  const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
  const db = new PGlite();
  const sandbox = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/email/delivery-registry.ts'),'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, sandbox);
  const { reserveDelivery: reserve, finishDelivery: finish } = sandbox.exports;
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    await db.exec(fs.readFileSync(process.argv[3] || path.join(__dirname,'fixtures/email-delivery-registry.sql'),'utf8'));
    assert.equal(await reserve(db,'a:3','a','j3'),true);
    assert.equal(await reserve(db,'a:3','a','j3'),false);
    assert.equal(await reserve(db,'a:5','a','j5'),false);
    assert.equal(await finish(db,'wrong','a','SENT'),false);
    assert.equal(await finish(db,'a:3','a','UNCERTAIN'),true);
    assert.equal(await reserve(db,'a:5','a','j5'),false);
    assert.equal(await finish(db,'a:3','a','SENT'),false);
    assert.equal(await reserve(db,'b:3','b','j3'),true);
    assert.equal(await finish(db,'b:3','b','SENT'),true);
    assert.equal(await reserve(db,'b:5','b','j5'),false);
    await db.query(`UPDATE email_recipient_gates SET "nextAllowedAt"=CURRENT_TIMESTAMP-INTERVAL '1 hour' WHERE "recipientKey"='b'`);
    assert.equal(await reserve(db,'b:3','b','j3'),false);
    assert.equal(await reserve(db,'b:5','b','j5'),true);
    assert.equal(await finish(db,'b:5','b','SUPPRESSED'),true);
    assert.equal(await reserve(db,'b:5','b','j5'),false);
    // Une panne à la dernière écriture doit annuler l'ensemble de la
    // transaction, pas laisser une entrée ou un verrou orphelin.
    const failingDb = {
      transaction: work => db.transaction(tx => work({
        query: async (sql, params) => {
          if (sql.startsWith('UPDATE email_recipient_gates')) throw new Error('injected database failure');
          return tx.query(sql, params);
        },
      })),
    };
    await assert.rejects(reserve(failingDb,'c:3','c','j3'),/injected/);
    assert.equal((await db.query(`SELECT * FROM email_deliveries WHERE "recipientKey"='c'`)).rows.length,0);
    assert.equal(await reserve(db,'c:3','c','j3'),true);
    await assert.rejects(finish(failingDb,'c:3','c','SENT'),/injected/);
    assert.equal((await db.query(`SELECT state FROM email_deliveries WHERE "deliveryKey"='c:3'`)).rows[0].state,'RESERVED');
    assert.equal(await reserve(db,'c:5','c','j5'),false);
    assert.equal(await finish(db,'c:3','c','UNCERTAIN'),true);
    assert.equal(await reserve(db,'c:3','c','j3'),false);
    await assert.rejects(finish(db,'c:3','c','SENT',-1),/Invalid cooldown/);
    console.log('PASS: 23 registry lifecycle and transaction-failure assertions against local SQL');
    console.log('LIMIT: single database connection; distributed races and provider delivery not validated');
  } finally { await db.close(); }
})().catch(error=>{ console.error(error); process.exitCode=1; });
