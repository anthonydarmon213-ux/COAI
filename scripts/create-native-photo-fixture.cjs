// Synthetic test pixels only. No user photograph or external service.
const sharp = require('sharp');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');

(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'coai-photo-fixture-'));
  const destination = path.join(directory, 'synthetic-turquoise.png');
  await sharp({ create: { width: 3200, height: 2400, channels: 3,
    background: { r: 17, g: 201, b: 183 } } }).png().toFile(destination);
  console.log(destination);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
