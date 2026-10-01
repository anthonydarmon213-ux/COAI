const assert = require('node:assert/strict');
const sharp = require('sharp');

// Called by the local-only fixture harness after the native UI test.
module.exports = async function verifyNativeProgressPhoto({ db, admin, user }) {
  assert.equal(user.email, 'coai-ui-20260924-http@example.test');
  assert.match(admin.supabaseUrl, /^http:\/\/(localhost|127\.0\.0\.1):54321\/?$/);
  const measures = await db.mesure.findMany({ where: { userId: user.id } });
  assert.equal(measures.length, 1);
  assert.equal(measures[0].poidsKg, 75);
  const path = measures[0].photoPath;
  assert(path && path.startsWith(`${user.supabaseAuthId}/`));
  const bucket = admin.storage.from('progress photos');
  const listed = await bucket.list(user.supabaseAuthId, { limit: 100 });
  assert.equal(listed.error, null);
  assert.equal(listed.data.length, 1);
  const downloaded = await bucket.download(path);
  assert.equal(downloaded.error, null);
  const bytes = Buffer.from(await downloaded.data.arrayBuffer());
  assert(bytes.length > 0 && bytes.length <= 2 * 1024 * 1024);
  const meta = await sharp(bytes).metadata();
  assert.equal(meta.width, 1600);
  assert.equal(meta.height, 1200);
  assert(['webp', 'png', 'jpeg'].includes(meta.format));
  // Safari can emit fresh EXIF colour-space/dimension tags from canvas.
  assert(!require('./photo-fixture-exif.cjs').hasGpsDirectory(meta.exif), 'GPS directory retained');
  assert(!bytes.includes(Buffer.from('COAI-SYNTHETIC-PRIVATE-MARKER')), 'Private fixture marker retained');
  const pixel = await sharp(bytes).resize(1, 1).removeAlpha().raw().toBuffer();
  const expected = process.argv.includes('--heic') ? [37, 91, 219]
    : process.argv.includes('--private-metadata') ? [201, 17, 183] : [17, 201, 183];
  expected.forEach((value, channel) => assert(Math.abs(pixel[channel] - value) <= 4));
  console.log(`PASS native photo persisted: one measure, matching synthetic pixels, ${meta.width}×${meta.height} ${meta.format}, ${bytes.length} bytes; GPS and private marker absent; technical EXIF present: ${Boolean(meta.exif)}`);
};
