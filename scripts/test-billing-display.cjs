const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync('src/app/(app)/compte/abonnement/page.tsx', 'utf8');
const condition = src.match(/const finProgrammee = ([\s\S]*?);/)[1];
const scheduled = new Function('user', 'statut', `return Boolean(${condition});`);
for (const status of ['ACTIVE', 'CANCELED', 'INCOMPLETE', 'PAST_DUE']) {
  for (const future of [true, false]) {
    for (const cancelAtPeriodEnd of [true, false]) {
      const subscription = { cancelAtPeriodEnd, currentPeriodEnd: new Date(Date.now() + (future ? 86400000 : -86400000)) };
      assert.equal(scheduled({ subscription }, status), status === 'ACTIVE' && future && cancelAtPeriodEnd);
    }
  }
}
assert.equal(scheduled({}, undefined), false);
assert.ok(!src.includes('PRIX_MENSUELS'), 'ne pas annoncer un ancien prix mensuel pour un essai annuel');
assert.ok(src.includes('tarif confirmé lors de ta souscription'));
console.log('PASS : résiliation future/terminée et suppression du tarif mensuel obsolète');
