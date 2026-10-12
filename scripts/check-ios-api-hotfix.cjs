#!/usr/bin/env node
// Read-only smoke check for the three iPhone APIs in this isolated release.
// Anonymous requests only: no account, database mutation, payment or webhook.
const routes = [
  '/api/ios/workout/today',
  '/api/ios/nutrition/recettes',
  '/api/ios/progress',
];

const argument = process.argv.find(value => value.startsWith('--origin='));
if (!argument || process.argv.length !== 3) {
  console.error('Usage: node scripts/check-ios-api-hotfix.cjs --origin=https://coai.fr');
  process.exit(2);
}

let origin;
try {
  const url = new URL(argument.slice('--origin='.length));
  const local = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const production = url.protocol === 'https:' && url.hostname === 'coai.fr';
  if ((!local && !production) || url.origin !== url.href.replace(/\/$/, '') || url.username || url.password) {
    throw Error('unsupported origin');
  }
  origin = url.origin;
} catch {
  console.error('Origin must be https://coai.fr or an HTTP loopback address, with no path or credentials.');
  process.exit(2);
}

(async () => {
  let failures = 0;
  for (const path of routes) {
    try {
      const response = await fetch(origin + path, { redirect: 'manual', cache: 'no-store' });
      const body = response.status === 401 && response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : null;
      const cache = response.headers.get('cache-control') || '';
      const vary = response.headers.get('vary') || '';
      const good = response.status === 401 && typeof body?.error === 'string' &&
        cache.includes('private') && cache.includes('no-store') &&
        vary.includes('Cookie') && vary.includes('Authorization');
      console.log(`${good ? 'PASS' : 'BLOCKED'}: GET ${path} → HTTP ${response.status}`);
      if (!good) failures++;
    } catch (error) {
      console.error(`BLOCKED: GET ${path} → ${error instanceof Error ? error.name : 'network error'}`);
      failures++;
    }
  }
  if (failures) {
    console.error(`${failures} route(s) not ready. Authenticated member data and payment remain untested.`);
    process.exitCode = 1;
  } else {
    console.log('PASS: anonymous route boundary only. Authenticated member data and payment remain untested.');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
