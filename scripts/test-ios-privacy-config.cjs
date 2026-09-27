const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readPlist = (file) => JSON.parse(execFileSync('/usr/bin/plutil',
  ['-convert', 'json', '-o', '-', path.join(root, file)], { encoding: 'utf8' }));

// Narrow regression guard for the app's existing native configuration.
// Not a full API inventory, App Privacy declaration or distribution validation.
function verify(manifest, info) {
  const entries = manifest.NSPrivacyAccessedAPITypes;
  assert(Array.isArray(entries), 'Required-reason API declarations missing');
  const defaults = entries.filter((entry) => entry.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryUserDefaults');
  assert.equal(defaults.length, 1, 'Exactly one UserDefaults declaration expected');
  assert.deepEqual(defaults[0].NSPrivacyAccessedAPITypeReasons, ['CA92.1'], 'App-only preferences reason changed: review actual usage');
  for (const key of ['NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription', 'NSPhotoLibraryAddUsageDescription', 'NSMicrophoneUsageDescription']) {
    assert.equal(typeof info[key], 'string', `${key} missing`);
    assert(info[key].trim().length > 0, `${key} empty`);
  }
  // Release currently has no ATS exceptions. A future exception needs an explicit review.
  assert.deepEqual(info.NSAppTransportSecurity ?? {}, {}, 'Unexpected transport-security exception');
}

const manifest = readPlist('ios/COAI/PrivacyInfo.xcprivacy');
const info = readPlist('ios/COAI/Info.plist');
verify(manifest, info);
assert.throws(() => verify({}, info));
assert.throws(() => verify({ NSPrivacyAccessedAPITypes: [] }, info));
const incorrectReason = structuredClone(manifest);
incorrectReason.NSPrivacyAccessedAPITypes[0].NSPrivacyAccessedAPITypeReasons = ['1C8F.1'];
assert.throws(() => verify(incorrectReason, info));
assert.throws(() => verify(manifest, { ...info, NSPhotoLibraryAddUsageDescription: '' }));
assert.throws(() => verify(manifest, { ...info, NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } }));
console.log('PASS: native privacy configuration and five negative cases; not a full privacy audit.');
