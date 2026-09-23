import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A deployment must not implicitly migrate the database shared with production.
const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(scripts.build, 'next build');
assert.equal(scripts.postinstall, 'prisma generate');
for (const hook of ['preinstall', 'install', 'prebuild', 'postbuild', 'prepare']) {
  assert.equal(scripts[hook], undefined, `Review ${hook}: automatic hooks must not mutate the database`);
}
console.log('PASS: build and install scripts do not run database migrations');
