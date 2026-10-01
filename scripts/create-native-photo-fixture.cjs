// Synthetic test pixels only. No user photograph or external service.
const sharp = require('sharp');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'coai-photo-fixture-'));
  const destination = path.join(directory, 'synthetic-turquoise.png');
  let image = sharp({ create: { width: 3200, height: 2400, channels: 3,
    background: process.argv.includes('--heic') ? { r: 37, g: 91, b: 219 }
      : process.argv.includes('--private-metadata') ? { r: 201, g: 17, b: 183 } : { r: 17, g: 201, b: 183 } } });
  if (process.argv.includes('--private-metadata')) {
    image = image.withExif({
      IFD0: { Artist: 'COAI-SYNTHETIC-PRIVATE-MARKER', ImageDescription: 'COAI-SYNTHETIC-PRIVATE-MARKER' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '48/1 51/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '2/1 21/1 0/1' },
    });
  }
  await image.png().toFile(destination);
  if (process.argv.includes('--private-metadata')) {
    const meta = await sharp(destination).metadata();
    assert(meta.exif?.includes(Buffer.from('COAI-SYNTHETIC-PRIVATE-MARKER')));
    assert(require('./photo-fixture-exif.cjs').hasGpsDirectory(meta.exif));
    console.log('Synthetic EXIF marker embedded (not personal data)');
  }
  if (process.argv.includes('--heic')) {
    const heic = path.join(directory, 'synthetic-cobalt.heic');
    execFileSync('/usr/bin/sips', ['-s', 'format', 'heic', destination, '--out', heic], { stdio: 'pipe' });
    assert((await fs.readFile(heic)).subarray(4, 32).includes('ftyp'));
    console.log(heic);
  } else console.log(destination);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
