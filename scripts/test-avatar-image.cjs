const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sharp = require('sharp');
const ts = require('typescript');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,
  '../src/lib/storage/photo-image.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, { exports: api, Buffer, require: name => { assert.equal(name, 'sharp'); return sharp; } });
(async () => {
  for (const format of ['jpeg', 'png', 'webp']) {
    const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#abcdef' } })[format]().toBuffer();
    const file = new File([bytes], `avatar.${format}`, { type: `image/${format}` });
    assert.equal(await api.isReadablePhoto(file), true, format);
    assert.equal(await api.isReadablePhoto(new File([bytes.subarray(0, 24)], 'broken', { type: file.type })), false);
    assert.equal(await api.isReadablePhoto(new File([bytes], 'wrong', { type: format === 'png' ? 'image/jpeg' : 'image/png' })), false);
  }
  for (const bytes of [Buffer.from('not an image'), Buffer.alloc(0), Buffer.alloc(2 * 1024 * 1024 + 1)]) {
    assert.equal(await api.isReadablePhoto(new File([bytes], 'avatar.png', { type: 'image/png' })), false);
  }
  const large = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: 'white' } }).png().toBuffer();
  assert.equal(await api.isReadablePhoto(new File([large], 'large.png', { type: 'image/png' })), false);
  console.log('PASS real image decoding: JPEG/PNG/WebP; corrupt, mismatched, empty, oversized bytes/pixels rejected');
})().catch(error => { console.error(error); process.exitCode = 1; });
