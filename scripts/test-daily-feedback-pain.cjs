const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/components/daily/daily-experience.tsx', 'utf8');
const start = source.indexOf('  async function submitFeedback()');
const end = source.indexOf('\n  return (', start);
assert.ok(start > 0 && end > start);
const sent = [];
let error = '';
const box = { rating: 'BIEN_DOSEE', feedbackPain: null, comment: '',
  setError: value => { error = value; }, post: async value => { sent.push(value); return true; },
  setFeedbackOpen: () => {}, router: { refresh() {} } };
vm.runInNewContext(ts.transpileModule(source.slice(start, end) + '\nglobalThis.submit=submitFeedback;', {}).outputText, box);
(async () => {
  await box.submit(); assert.equal(sent.length, 0); assert.match(error, /douleur/);
  box.feedbackPain = false; await box.submit(); assert.equal(sent[0].feedbackPain, false);
  box.feedbackPain = true; await box.submit(); assert.equal(sent[1].feedbackPain, true);
  box.rating = ''; await box.submit(); assert.equal(sent.length, 2);
  console.log('PASS : absence de réponse refusée ; oui/non explicites transmis ; ressenti requis. Transport simulé, pas de données enregistrées.');
})().catch(error => { console.error(error); process.exitCode = 1; });
