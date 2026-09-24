// Run against an already started, isolated local COAI server. Never production.
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {createClient} = require('@supabase/supabase-js');
const {createServerClient} = require('@supabase/ssr');
const {PrismaClient} = require('@prisma/client');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
const databaseURL = new URL(process.env.DATABASE_URL);
assert.equal(databaseURL.hostname, '127.0.0.1');
assert.equal(databaseURL.port, '54322');
const origin = 'http://127.0.0.1:3050';
const db = new PrismaClient();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {persistSession: false, autoRefreshToken: false},
});
const fixtures = [];
function assertPrivateHistory(response) {
  const directives = response.headers.get('cache-control')?.toLowerCase().split(',').map(value => value.trim()) ?? [];
  assert.ok(directives.includes('private') && directives.includes('no-store'), 'Personal history must not be stored');
  const vary = response.headers.get('vary')?.toLowerCase().split(',').map(value => value.trim()) ?? [];
  assert.ok(vary.includes('cookie') && vary.includes('authorization'), 'Both authentication methods must vary');
}
async function fixture() {
  const email = `coai-http-${randomUUID()}@example.test`, password = randomUUID() + 'aA1!';
  const {data, error} = await admin.auth.admin.createUser({email, password, email_confirm: true});
  assert.equal(error, null);
  const owned = {authId: data.user.id}; fixtures.push(owned);
  owned.user = await db.user.create({data: {email, supabaseAuthId: data.user.id}});
  const jar = new Map();
  owned.client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {getAll: () => [...jar].map(([name, value]) => ({name, value})),
      setAll: updates => updates.forEach(({name, value}) => jar.set(name, value))},
  });
  const signed = await owned.client.auth.signInWithPassword({email, password});
  assert.equal(signed.error, null);
  owned.bearer = {Authorization: `Bearer ${signed.data.session.access_token}`};
  owned.cookie = {Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ')};
  return owned;
}
async function main() {
  const endpoint = origin + '/api/seances';
  const anonymousHistory = await fetch(endpoint);
  assert.equal(anonymousHistory.status, 401); assertPrivateHistory(anonymousHistory);
  const a = await fixture(), b = await fixture();
  const exportURL = origin + '/api/compte/export';
  const anonymousExport = await fetch(exportURL);
  assert.equal(anonymousExport.status, 401); assertPrivateHistory(anonymousExport);
  const emptyExport = await fetch(exportURL, {headers: a.cookie});
  assert.equal(emptyExport.status, 200);
  const emptyData = await emptyExport.json();
  assert.equal(emptyData.applePurchaseAccount, null);
  assert.deepEqual(emptyData.aiUsageEvents, []);
  for (const owner of [a, b]) {
    owner.appleFixtureId = 'local-export-' + randomUUID();
    await db.applePurchaseAccount.create({data: {userId: owner.user.id, accountToken: randomUUID(),
      transactions: {create: {environment: 'Sandbox', transactionId: owner.appleFixtureId,
        originalTransactionId: owner.appleFixtureId, productId: 'local.export.fixture',
        purchasedAt: new Date('2020-01-01'), expiresAt: new Date('2020-02-01'), signedAt: new Date('2020-01-01')}}}});
    owner.usageFixture = await db.aiUsageEvent.create({data: {userId: owner.user.id,
      feature: 'local-export-fixture', model: 'no-model-called', inputTokens: 0, outputTokens: 0, estimatedCostUsdMicros: 0}});
  }
  for (const [owner, otherOwner] of [[a, b], [b, a]]) {
    for (const headers of [owner.cookie, owner.bearer]) {
      const exported = await fetch(exportURL + '?userId=' + otherOwner.user.id, {headers});
      assert.equal(exported.status, 200); assertPrivateHistory(exported);
      const data = await exported.json();
      assert.equal(data.id, owner.user.id);
      assert.equal(data.applePurchaseAccount.userId, owner.user.id);
      assert.deepEqual(data.applePurchaseAccount.transactions.map(row => row.transactionId), [owner.appleFixtureId]);
      assert.deepEqual(data.aiUsageEvents.map(row => row.id), [owner.usageFixture.id]);
      assert(!JSON.stringify(data).includes(otherOwner.appleFixtureId));
      assert(!JSON.stringify(data).includes(otherOwner.usageFixture.id));
    }
  }
  console.log('PASS HTTP account export: actual Apple/AI joins, absent account, cookie/bearer, ignored forged owner, private responses; no provider calls');
  for (const path of ['/api/daily', '/api/check-in-hebdo']) {
    for (const headers of [undefined, a.cookie, a.bearer]) {
      const response = await fetch(origin + path, {headers});
      assert.equal(response.status, headers ? 200 : 401);
      assertPrivateHistory(response);
    }
  }
  const payload = {date: new Date().toISOString(), source: 'PROGRAMME',
    exercices: [{nom: 'Test local', sets: [{set: 1, reps: 8, charge: 12}]}], energie: 4, difficulte: 3, douleur: 'AUCUNE'};
  const post = body => fetch(endpoint, {method: 'POST', headers: {...a.cookie, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const responses = await Promise.all([post(payload), post(payload), post(payload)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 200, 201]);
  const bodies = await Promise.all(responses.map(r => r.json()));
  assert.equal(new Set(bodies.map(row => row.id)).size, 1);
  const retry = await post({...payload, notes: 'Must not replace the original'});
  assert.equal(retry.status, 200); assert.equal((await retry.json()).notes, null);
  const history = await fetch(endpoint, {headers: a.bearer}); assert.equal(history.status, 200);
  assertPrivateHistory(history);
  const rows = await history.json(); assert.equal(rows.length, 1);
  assert.equal(rows[0].exercices[0].sets[0].charge, 12);
  assert.equal(await db.seanceLog.count({where: {userId: a.user.id}}), 1);
  const other = await fetch(endpoint, {headers: b.cookie}); assert.equal(other.status, 200);
  assertPrivateHistory(other);
  assert.deepEqual(await other.json(), []);
  assert.equal((await fetch(endpoint, {headers: {...a.cookie, Authorization: 'Bearer invalid'}})).status, 401);
  const malformed = await fetch(endpoint, {method: 'POST', headers: {...a.cookie, 'Content-Type': 'application/json'}, body: '{'});
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), {error: 'Données de séance illisibles. Réessaie l’enregistrement.'});
  assert.equal(await db.seanceLog.count({where: {userId: a.user.id}}), 1);
  console.log('PASS HTTP workout: cookie + bearer, concurrency/retry, history, account isolation, invalid token/JSON');

  const measureKey = randomUUID();
  const measureBody = {date: '2026-09-24', poidsKg: 80};
  const postMeasure = (owner, body = measureBody, key = measureKey) => fetch(origin + '/api/mesures', {
    method: 'POST', headers: {...owner.cookie, 'Content-Type': 'application/json', 'x-coai-request-id': key}, body: JSON.stringify(body),
  });
  const anonymousMeasures = await fetch(origin + '/api/mesures');
  assert.equal(anonymousMeasures.status, 401); assertPrivateHistory(anonymousMeasures);
  const measureResponses = await Promise.all([postMeasure(a), postMeasure(a), postMeasure(a)]);
  assert.deepEqual(measureResponses.map(r => r.status).sort(), [200, 200, 201]);
  const measureRows = await Promise.all(measureResponses.map(r => r.json()));
  assert.equal(new Set(measureRows.map(r => r.id)).size, 1);
  assert.equal(await db.mesure.count({where: {userId: a.user.id}}), 1);
  assert.equal((await postMeasure(a, {...measureBody, poidsKg: 81})).status, 409);
  const measureHistory = await fetch(origin + '/api/mesures', {headers: a.bearer});
  assert.equal(measureHistory.status, 200);
  assertPrivateHistory(measureHistory);
  const savedMeasures = await measureHistory.json();
  assert.equal(savedMeasures.length, 1); assert.equal(savedMeasures[0].poidsKg, 80);
  const otherMeasures = await fetch(origin + '/api/mesures', {headers: b.cookie});
  assert.equal(otherMeasures.status, 200); assertPrivateHistory(otherMeasures);
  assert.deepEqual(await otherMeasures.json(), []);
  assert.equal((await postMeasure(b)).status, 201);
  assert.equal((await postMeasure(a, {...measureBody, photoPath: `${b.authId}/private.jpg`})).status, 400);
  assert.equal((await postMeasure(a, measureBody, 'invalid')).status, 400);
  assert.equal((await fetch(origin + '/api/mesures', {headers: {...a.cookie, Authorization: 'Bearer invalid'}})).status, 401);
  assert.equal(await db.mesure.count({where: {userId: a.user.id}}), 1);
  console.log('PASS HTTP measures: real login, concurrent retries, conflict, persisted history, owner/photo isolation, invalid key/token');

  const weeklyURL = origin + '/api/check-in-hebdo';
  const postWeekly = body => fetch(weeklyURL, {method: 'POST',
    headers: {...a.cookie, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  assert.equal((await fetch(weeklyURL)).status, 401);
  let weekly = await (await fetch(weeklyURL, {headers: a.cookie})).json();
  assert.equal(weekly.du, true); assert.equal(weekly.dernier, null);
  for (const empty of [{}, {commentaire: '   '}, {userId: b.user.id}]) {
    assert.equal((await postWeekly(empty)).status, 400);
  }
  assert.equal(await db.weeklyCheckin.count({where: {userId: a.user.id}}), 0);
  const weeklyBody = {energie: 3, douleurs: false, seancesRealisees: 0, repasMaison: 0,
    commentaire: '  Bilan local  ', userId: b.user.id};
  const weeklyResponses = await Promise.all([postWeekly(weeklyBody), postWeekly(weeklyBody)]);
  assert.deepEqual(weeklyResponses.map(r => r.status), [201, 201]);
  const weeklyRows = await Promise.all(weeklyResponses.map(r => r.json()));
  assert.equal(weeklyRows[0].id, weeklyRows[1].id);
  assert.equal(await db.weeklyCheckin.count({where: {userId: a.user.id}}), 1);
  const savedWeeklyResponse = await fetch(weeklyURL, {headers: a.bearer});
  assertPrivateHistory(savedWeeklyResponse);
  weekly = await savedWeeklyResponse.json();
  assert.equal(weekly.du, false); assert.equal(weekly.dernier.energie, 3);
  assert.equal(weekly.dernier.douleurs, false); assert.equal(weekly.dernier.seancesRealisees, 0);
  assert.equal(weekly.dernier.commentaire, 'Repas maison : 0 — Bilan local');
  const otherWeekly = await (await fetch(weeklyURL, {headers: b.cookie})).json();
  assert.equal(otherWeekly.du, true); assert.equal(otherWeekly.dernier, null);
  assert.equal((await postWeekly({energie: 4})).status, 201);
  weekly = await (await fetch(weeklyURL, {headers: a.cookie})).json();
  assert.equal(weekly.dernier.energie, 4); assert.equal(weekly.dernier.douleurs, false);
  assert.equal(await db.weeklyCheckin.count({where: {userId: a.user.id}}), 1);
  assert.equal((await fetch(weeklyURL, {headers: {...a.cookie, Authorization: 'Bearer invalid'}})).status, 401);
  console.log('PASS HTTP weekly check-in: empty rejection, concurrent save, persisted false/zero, partial update, cookie/bearer and account isolation');

  const updateProfile = body => fetch(origin + '/api/profil', {
    method: 'PUT', headers: {...a.cookie, 'Content-Type': 'application/json'}, body: JSON.stringify(body),
  });
  let response = await updateProfile({poidsKg: 80, tailleCm: 180, age: 35, objectifs: 'Test local', cycleMenstruelSuivi: true});
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /private, no-store/);
  response = await updateProfile({poidsKg: null, tailleCm: null, age: null, objectifs: '', cycleMenstruelSuivi: false, userId: b.user.id});
  assert.equal(response.status, 200);
  const profile = await db.profile.findUnique({where: {userId: a.user.id}});
  assert.equal(profile.poidsKg, null); assert.equal(profile.tailleCm, null); assert.equal(profile.age, null);
  assert.equal(profile.objectifs, ''); assert.equal(profile.cycleMenstruelSuivi, false);
  assert.equal(await db.profile.count({where: {userId: b.user.id}}), 0);
  assert.equal((await updateProfile({poidsKg: -1})).status, 400);
  assert.equal((await db.profile.findUnique({where: {userId: a.user.id}})).poidsKg, null);
  console.log('PASS HTTP profile: persisted edits, cleared values/opt-out, invalid values rejected, forged ownership ignored');

  const activate = owner => fetch(origin + '/api/programmes/generate?mode=onboarding', {
    method: 'POST', headers: owner.cookie,
  });
  assert.equal((await activate(a)).status, 403);
  // Local fixture only: historical programme entitlement, no purchase/provider.
  await db.user.update({where: {id: a.user.id}, data: {programmeUnlockedAt: new Date()}});
  assert.equal((await activate(a)).status, 422);
  response = await updateProfile({objectifs: 'Rester en forme', niveau: 'Débutant',
    frequenceEntrainement: '2 fois par semaine', dureeSeanceMinutes: 45,
    equipementDisponible: 'Salle de sport', age: 35, sexe: 'Homme'});
  assert.equal(response.status, 200);
  const activations = await Promise.all([activate(a), activate(a), activate(a)]);
  assert.deepEqual(activations.map(r => r.status), [201, 201, 201]);
  const activationBodies = await Promise.all(activations.map(r => r.json()));
  const programmes = await db.programmeGenerated.findMany({where: {userId: a.user.id}});
  assert.equal(programmes.length, 3);
  assert.deepEqual(programmes.map(p => p.pilier).sort(), ['ENTRAINEMENT', 'NUTRITION', 'RECUPERATION']);
  for (const body of activationBodies) {
    assert.equal(body.echecs, 0);
    assert.deepEqual(body.programmes.map(p => p.id).sort(), programmes.map(p => p.id).sort());
    assert.ok(body.programmes.every(p => !('contenu' in p)));
  }
  assert.ok(programmes.every(p => p.version === 1 && p.contenu && Object.keys(p.contenu).length > 0));
  const resumed = await activate(a);
  assert.equal(resumed.status, 201); assert.equal((await resumed.json()).reused, true);
  assert.equal(await db.programmeGenerated.count({where: {userId: a.user.id}}), 3);
  assert.equal((await activate(b)).status, 403);
  assert.equal(await db.programmeGenerated.count({where: {userId: b.user.id}}), 0);
  const escapeHTML = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
  for (const [path, pilier, heading] of [
    ['/programme/entrainement', 'ENTRAINEMENT', 'Ton entraînement.'],
    ['/programme/alimentation', 'NUTRITION', 'Ton alimentation.'],
    ['/programme/recuperation', 'RECUPERATION', 'Ta récupération.'],
  ]) {
    const page = await fetch(origin + path, {headers: a.cookie, redirect: 'manual'});
    assert.equal(page.status, 200, path);
    const html = await page.text();
    assert.ok(html.includes('<main'), path + ' has main content');
    assert.ok(html.includes(heading), path + ' has the expected heading');
    const title = programmes.find(p => p.pilier === pilier).contenu.titre;
    assert.equal(typeof title, 'string');
    assert.ok(title.length > 0 && html.includes(escapeHTML(title)), path + ' displays persisted catalogue title');
    assert.ok(!html.includes('NEXT_REDIRECT') && !html.includes('NEXT_HTTP_ERROR_FALLBACK'), path + ' has no server error/redirect');
  }
  // Historical persisted programmes must obey the same media rule as new catalogue plans.
  const training = programmes.find(p => p.pilier === 'ENTRAINEMENT');
  const legacyContent = { titre: 'Programme historique de test', seances: [{
    nom: 'Séance historique', jour: 'LUN', echauffement: 'Préparation locale', retourAuCalme: 'Repos local',
    exercices: [{nom: 'Hip thrust barre', series: 3}, {nom: 'Leg curl allongé', series: 3, repetitions: '8-12', repos: '60 sec'}],
  }] };
  await db.programmeGenerated.update({where: {id: training.id}, data: {contenu: legacyContent}});
  for (const path of ['/programme/entrainement', '/programme/seance-du-jour?seance=0']) {
    const response = await fetch(origin + path, {headers: a.cookie});
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('Leg curl (machine)'), path + ' retains canonical demonstrated movement');
    assert.ok(!html.includes('Hip thrust barre'), path + ' removes undemonstrated movement');
  }
  for (const path of ['/api/programmes/fiche-complete', '/api/programmes/entrainement/pdf']) {
    const response = await fetch(origin + path, {headers: a.cookie});
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.ok(bytes.length > 1000);
  }
  assert.deepEqual((await db.programmeGenerated.findUnique({where: {id: training.id}})).contenu, legacyContent);
  console.log('PASS HTTP legacy media: persisted fixture filtered on both pages, both authenticated PDF downloads valid, database unchanged');
  const dailyURL = origin + '/api/daily';
  assert.equal((await fetch(dailyURL)).status, 401);
  assert.equal((await fetch(dailyURL, {headers: b.cookie})).status, 200);
  assert.equal(await (await fetch(dailyURL, {headers: b.cookie})).json(), null);
  const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][new Date().getDay()];
  for (const exercises of [legacyContent.seances[0].exercices, [{nom: 'Hip thrust barre', series: 3}]]) {
    const content = { ...legacyContent, seances: [{ ...legacyContent.seances[0], jour: dayName, exercices: exercises }] };
    await db.programmeGenerated.update({where: {id: training.id}, data: {contenu: content}});
    const concurrentDaily = await Promise.all([0, 1, 2].map(() => fetch(dailyURL, {method: 'POST', headers: {...a.cookie, 'Content-Type': 'application/json'},
      body: JSON.stringify({action: 'checkin', sleep: 'BON', energy: 'NORMALE', pain: false,
        availableMinutes: 60, equipementDuJour: 'Salle de sport complète', userId: b.user.id})})));
    assert.deepEqual(concurrentDaily.map(r => r.status), [200, 200, 200]);
    const response = concurrentDaily[0];
    assert.equal(response.status, 200);
    const saved = await response.json();
    const expectedNames = exercises.length === 2 ? ['Leg curl (machine)'] : [];
    assert.equal(saved.userId, a.user.id);
    assert.deepEqual(saved.adaptedSession.exercices.map(e => e.nom), expectedNames);
    assert.equal(saved.adaptedSession.mediasIndisponibles, expectedNames.length === 0);
    assert.deepEqual(saved.sourceSession.exercices, exercises);
    assert.equal(saved.adaptation.originalExerciseCount, exercises.length);
    assert.equal(saved.adaptation.adaptedExerciseCount, expectedNames.length);
    const reloadedResponse = await fetch(dailyURL, {headers: a.bearer});
    assert.equal(reloadedResponse.status, 200);
    assertPrivateHistory(reloadedResponse);
    const reloaded = await reloadedResponse.json();
    assert.equal(reloaded.id, saved.id);
    assert.deepEqual(reloaded.adaptedSession, saved.adaptedSession);
    const stored = await db.dailySession.findUnique({where: {id: saved.id}});
    assert.deepEqual(stored.adaptedSession, saved.adaptedSession);
    assert.equal(await db.dailySession.count({where: {userId: a.user.id}}), 1);
    assert.equal(await db.dailySession.count({where: {userId: b.user.id}}), 0);
    assert.deepEqual((await db.programmeGenerated.findUnique({where: {id: training.id}})).contenu, content);
  }
  assert.equal(await (await fetch(dailyURL, {headers: b.cookie})).json(), null);
  assert.equal((await fetch(dailyURL, {headers: {...a.cookie, Authorization: 'Bearer invalid'}})).status, 401);
  console.log('PASS HTTP daily media: real check-in, canonical/empty adaptation, persisted marker, cookie/bearer reload, source unchanged, account isolation');
  const beforeInvalidDaily = await db.dailySession.findMany({where: {userId: a.user.id}});
  const invalidDaily = await fetch(dailyURL, {method: 'POST', headers: {...a.cookie, 'Content-Type': 'application/json'}, body: '{'});
  assert.equal(invalidDaily.status, 400);
  assert.deepEqual(await invalidDaily.json(), {error: 'Données du check-in illisibles. Réessaie l’enregistrement.'});
  assert.deepEqual(await db.dailySession.findMany({where: {userId: a.user.id}}), beforeInvalidDaily);
  console.log('PASS HTTP daily invalid JSON: readable 400, saved daily unchanged');
  const postDaily = body => fetch(dailyURL, {method: 'POST', headers: {...a.cookie, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const beforeEmptyCompletion = await db.dailySession.findMany({where: {userId: a.user.id}});
  for (const body of [{action: 'complete'}, {action: 'feedback', workoutRating: 'BIEN_DOSEE', feedbackPain: false}]) {
    assert.equal((await postDaily(body)).status, 409, 'An unavailable workout cannot be completed or rated');
  }
  assert.deepEqual(await db.dailySession.findMany({where: {userId: a.user.id}}), beforeEmptyCompletion);
  const checkin = {action: 'checkin', sleep: 'BON', energy: 'NORMALE', pain: false, availableMinutes: 60};
  const tomorrowName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][(new Date().getDay() + 1) % 7];
  const restContent = {...legacyContent, seances: [{...legacyContent.seances[0], jour: tomorrowName}]};
  await db.programmeGenerated.update({where: {id: training.id}, data: {contenu: restContent, version: training.version + 1}});
  const restResponse = await postDaily({...checkin, availableMinutes: undefined});
  assert.equal(restResponse.status, 200);
  const rest = await restResponse.json();
  assert.equal(rest.sourceSession, null);
  assert.equal(rest.adaptedSession, null);
  assert.equal(rest.adaptation, null);
  assert.equal(rest.availableMinutes, null);
  assert.equal(rest.programmeVersion, training.version + 1);
  assert.equal((await postDaily({action: 'complete'})).status, 409, 'A rest check-in is not a completed workout');
  const trainingContent = {...legacyContent, seances: [{...legacyContent.seances[0], jour: dayName}]};
  await db.programmeGenerated.update({where: {id: training.id}, data: {contenu: trainingContent}});
  const changedDashboard = await fetch(origin + '/dashboard', {headers: a.cookie});
  assert.equal(changedDashboard.status, 200);
  assert((await changedDashboard.text()).includes('Confirme ton bilan pour adapter cette nouvelle séance.'));
  assert.equal((await postDaily(checkin)).status, 200);
  assert.equal((await postDaily({action: 'complete'})).status, 200);
  const completed = await db.dailySession.findUnique({where: {id: rest.id}});
  assert(completed.completedAt);
  const historyAfterDaily = await fetch(origin + '/api/seances', {headers: a.cookie});
  assert.equal(historyAfterDaily.status, 200);
  const combinedHistory = await historyAfterDaily.json();
  const dailyEntry = combinedHistory.find(row => row.dailySessionId === completed.id);
  assert(dailyEntry);
  assert.equal(dailyEntry.dailyTitle, 'Séance historique');
  assert.deepEqual(dailyEntry.exercices, []);
  assert.equal(dailyEntry.dureeMinutes, null);
  assert.equal(combinedHistory.length, await db.seanceLog.count({where: {userId: a.user.id}}) + 1);
  const cardUrl = origin + '/api/suivi/bilan-mensuel/carte';
  assert.equal((await fetch(cardUrl)).status, 401);
  const dailyOnly = await fixture();
  assert.equal((await fetch(cardUrl, {headers: dailyOnly.cookie})).status, 404);
  await db.dailySession.create({data: {userId: dailyOnly.user.id, date: new Date(),
    completedAt: new Date(), adaptedSession: {nom: 'Séance quotidienne de test'}}});
  assert.equal(await db.seanceLog.count({where: {userId: dailyOnly.user.id}}), 0);
  const monthlyCard = await fetch(cardUrl, {headers: dailyOnly.cookie});
  assert.equal(monthlyCard.status, 200);
  assert.match(monthlyCard.headers.get('cache-control'), /private.*no-store/);
  const monthlyPng = Buffer.from(await monthlyCard.arrayBuffer());
  assert.equal(monthlyPng.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal((await fetch(cardUrl, {headers: b.cookie})).status, 404);
  console.log('PASS monthly card HTTP: daily-only member, real PNG, private cache, unauthenticated and other account excluded');
  assert.equal((await postDaily({action: 'complete'})).status, 200);
  const retriedHistory = await (await fetch(origin + '/api/seances', {headers: a.cookie})).json();
  assert.equal(retriedHistory.filter(row => row.dailySessionId === completed.id).length, 1);
  const otherHistory = await (await fetch(origin + '/api/seances', {headers: b.cookie})).json();
  assert(!otherHistory.some(row => row.dailySessionId === completed.id));
  const journal = await fetch(origin + '/suivi/seances', {headers: a.cookie});
  assert.equal(journal.status, 200);
  assert((await journal.text()).includes('Séance quotidienne terminée'));
  console.log('PASS HTTP unified history: daily visible once after retry, no invented metrics, journal visible, other account isolated');
  const protectedResponses = await Promise.all([postDaily({...checkin, sleep: 'MAUVAIS'}), postDaily({...checkin, pain: true})]);
  assert.deepEqual(protectedResponses.map(r => r.status), [409, 409]);
  assert.deepEqual(await db.dailySession.findUnique({where: {id: rest.id}}), completed);
  await db.programmeGenerated.update({where: {id: training.id}, data: {contenu: restContent}});
  assert.equal((await postDaily(checkin)).status, 409);
  assert.deepEqual(await db.dailySession.findUnique({where: {id: rest.id}}), completed);
  const completedDashboard = await fetch(origin + '/dashboard', {headers: a.cookie});
  assert.equal(completedDashboard.status, 200);
  const completedHTML = await completedDashboard.text();
  assert(completedHTML.replace(/<!--[\s\S]*?-->/g, '').includes(`Mes repères · ${combinedHistory.length} séance`), 'Dashboard includes the daily completion');
  assert(completedHTML.includes('Séance historique'));
  assert(completedHTML.includes('Retrouve ta séance terminée et son bilan.'));
  assert(!completedHTML.includes('ton programme prévoit du repos'));
  console.log('PASS HTTP daily lifecycle: rest clears unfinished adaptation; completed snapshot survives concurrent check-ins and programme change');
  // Reset only this disposable local fixture for independent recovery/pain cases.
  await db.dailySession.update({where: {id: rest.id}, data: {completedAt: null}});
  await db.programmeGenerated.update({where: {id: training.id}, data: {contenu: trainingContent}});
  assert.equal((await postDaily({...checkin, pain: true, painArea: 'Genou'})).status, 200);
  assert.equal((await postDaily({action: 'complete'})).status, 409);
  assert.equal((await postDaily({...checkin, chargeMentale: 'SATUREE'})).status, 200);
  const recoveryComplete = await postDaily({action: 'complete'});
  assert.equal(recoveryComplete.status, 200, 'Keep intentional guided recovery available');
  const recovery = await recoveryComplete.json();
  assert.equal((await postDaily({action: 'complete'})).status, 200);
  assert.equal((await db.dailySession.findUnique({where: {id: rest.id}})).completedAt.toISOString(), recovery.completedAt);
  console.log('PASS HTTP daily completion: unavailable/rest/pain rejected unchanged; guided recovery and completion retry preserved');
  // A completed profile with a declared constraint must not get a generic programme.
  await db.user.update({where: {id: b.user.id}, data: {programmeUnlockedAt: new Date()}});
  await db.profile.create({data: {userId: b.user.id, objectifs: 'Rester en forme', niveau: 'Débutant',
    frequenceEntrainement: '2 fois par semaine', dureeSeanceMinutes: 45,
    equipementDisponible: 'Salle de sport', age: 35, sexe: 'Homme', contraintesSante: 'Contrainte déclarée de test'}});
  const constrained = await activate(b);
  assert.equal(constrained.status, 409);
  assert.equal((await constrained.json()).requiresCoachReview, true);
  assert.equal(await db.programmeGenerated.count({where: {userId: b.user.id}}), 0);
  console.log('PASS HTTP programme: real auth/profile/catalogue/database, 3 concurrent activations without duplicates, retry, other account denied, three server-rendered pillar pages');
  console.log('LIMIT: local HTTP/Auth/DB, not browser UI, physical iPhone, production or Apple purchases');
}
async function cleanup() {
  const errors = [];
  for (const owned of fixtures) {
    try {
      if (owned.client) await owned.client.auth.signOut();
      if (owned.user) {
        // AI usage uses SetNull on user deletion; remove only our exact fixtures first.
        await db.aiUsageEvent.deleteMany({where: {userId: owned.user.id}});
        await db.seanceLog.deleteMany({where: {userId: owned.user.id}});
        await db.profile.deleteMany({where: {userId: owned.user.id}});
        await db.user.delete({where: {id: owned.user.id}});
      }
      const {error} = await admin.auth.admin.deleteUser(owned.authId); assert.equal(error, null);
    } catch (error) { errors.push(error); }
  }
  await db.$disconnect();
  assert.equal(errors.length, 0, 'Local fixture cleanup failed');
  console.log('PASS temporary local fixtures cleaned');
}
main().catch(error => {console.error(error.message); process.exitCode = 1;})
  .finally(cleanup).catch(error => {console.error(error.message); process.exitCode = 1;});
