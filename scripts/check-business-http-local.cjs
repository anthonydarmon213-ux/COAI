// Called by the isolated Auth/PostgreSQL harness with its disposable accounts.
const assert = require('node:assert/strict');
module.exports = async function checkBusiness({ db, adminUser, memberUser, origin }) {
  assert.equal(origin, 'http://localhost:3050');
  const url = origin + '/admin/business';
  for (const headers of [{}, memberUser.cookie]) {
    const response = await fetch(url, { headers, redirect: 'manual' });
    const html = await response.text();
    assert(!html.includes('Preuve d&#x27;usage réel'));
    assert(response.status === 307 || response.status === 303 || html.includes('NEXT_REDIRECT'));
  }
  async function displayedCount() {
    const response = await fetch(url, { headers: adminUser.cookie, redirect: 'manual' });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert(!html.includes('NEXT_REDIRECT'));
    assert.match(response.headers.get('cache-control') || '', /private|no-store/);
    const match = html.match(/Séances loggées<\/span>\s*<p[^>]*>(\d+)<\/p>/);
    assert(match, 'The rendered session counter must exist');
    return Number(match[1]);
  }
  const before = await displayedCount();
  const expected = await db.seanceLog.count() + await db.dailySession.count({ where: { completedAt: { not: null } } });
  assert.equal(before, expected, 'Rendered count matches both real tables');
  const unfinished = await db.dailySession.create({ data: {
    userId: adminUser.user.id, date: new Date('2026-09-20T00:00:00Z'),
  } });
  try {
    assert.equal(await displayedCount(), before, 'Planned sessions do not count');
    await db.dailySession.update({ where: { id: unfinished.id }, data: { completedAt: new Date() } });
    assert.equal(await displayedCount(), before + 1, 'A newly completed session is visible');
    await db.user.update({ where: { id: adminUser.user.id }, data: { isAdmin: false } });
    const revoked = await fetch(url, { headers: adminUser.cookie, redirect: 'manual' });
    const denied = await revoked.text();
    assert(revoked.status === 307 || revoked.status === 303 || denied.includes('NEXT_REDIRECT'));
  } finally {
    await db.dailySession.delete({ where: { id: unfinished.id } });
  }
  console.log('PASS business real local HTTP: anonymous/member denied; rendered counter includes completed daily sessions only; same cookie denied after admin role removal.');
};
