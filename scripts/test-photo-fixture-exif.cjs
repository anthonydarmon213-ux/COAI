const assert = require('node:assert/strict');
const { hasGpsDirectory } = require('./photo-fixture-exif.cjs');
for (const little of [true, false]) {
  const data = Buffer.alloc(26);
  data.write(little ? 'II' : 'MM');
  const u16 = (value, offset) => little ? data.writeUInt16LE(value, offset) : data.writeUInt16BE(value, offset);
  const u32 = (value, offset) => little ? data.writeUInt32LE(value, offset) : data.writeUInt32BE(value, offset);
  u16(42, 2); u32(8, 4); u16(1, 8); u16(0x8825, 10);
  assert.equal(hasGpsDirectory(data), true);
  assert.equal(hasGpsDirectory(Buffer.concat([Buffer.from('Exif\0\0'), data])), true);
  u16(0x8769, 10);
  assert.equal(hasGpsDirectory(data), false);
  assert.throws(() => hasGpsDirectory(data.subarray(0, 12)));
}
assert.equal(hasGpsDirectory(undefined), false);
assert.throws(() => hasGpsDirectory(Buffer.alloc(8)));
console.log('PASS EXIF test reader: both byte orders, GPS pointer, technical directory, prefix, malformed rejection');
