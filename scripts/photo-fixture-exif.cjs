const assert = require('node:assert/strict');

// Test-only TIFF IFD0 reader: detect the standard GPS directory pointer.
function hasGpsDirectory(exif) {
  if (!exif) return false;
  const data = exif.subarray(exif.subarray(0, 6).equals(Buffer.from('Exif\0\0')) ? 6 : 0);
  assert(data.length >= 8);
  const order = data.toString('ascii', 0, 2);
  assert(['II', 'MM'].includes(order));
  const u16 = offset => order === 'II' ? data.readUInt16LE(offset) : data.readUInt16BE(offset);
  const u32 = offset => order === 'II' ? data.readUInt32LE(offset) : data.readUInt32BE(offset);
  assert.equal(u16(2), 42);
  const offset = u32(4), count = u16(offset);
  assert(offset + 2 + count * 12 <= data.length);
  for (let i = 0; i < count; i++) {
    if (u16(offset + 2 + i * 12) === 0x8825) return true;
  }
  return false;
}
module.exports = { hasGpsDirectory };
