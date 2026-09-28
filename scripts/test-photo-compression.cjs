const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/images/compress-progress-photo.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function setup({ type = 'image/webp', bytes = 'encoded pixels', width = 4000, height = 3000, unreadable = false, noContext = false, nullBlob = false } = {}) {
  const revoked = [], draws = [], created = [];
  let canvas;
  const box = { exports: {}, Blob, File, Set, Number,
    URL: { createObjectURL: file => { created.push(file); return 'blob:local-fixture'; }, revokeObjectURL: url => revoked.push(url) },
    Image: class { naturalWidth = width; naturalHeight = height;
      set src(_) { queueMicrotask(() => unreadable ? this.onerror() : this.onload()); }
    },
    document: { createElement: tag => {
      assert.equal(tag, 'canvas');
      canvas = { width: 0, height: 0,
        getContext: () => noContext ? null : { drawImage: (...args) => draws.push(args) },
        toBlob: (done, mime, quality) => {
          assert.equal(mime, 'image/webp'); assert.equal(quality, 0.78);
          done(nullBlob ? null : new Blob([bytes], { type }));
        },
      };
      return canvas;
    } },
  };
  vm.runInNewContext(compiled, box);
  return { compress: box.exports.compressProgressPhoto, revoked, draws, created, canvas: () => canvas };
}
const input = () => new File(['private-source-metadata'], 'private-name-location.jpg', { type: 'image/jpeg' });
(async () => {
  for (const [type, extension] of [['image/webp', 'webp'], ['image/png', 'png'], ['image/jpeg', 'jpg']]) {
    const test = setup({ type });
    const result = await test.compress(input());
    assert.equal(result.file.type, type);
    assert.equal(result.file.name, `coai-photo.${extension}`);
    assert.equal(await result.file.text(), 'encoded pixels');
    assert.equal(result.originalBytes, input().size);
    assert.equal(result.optimizedBytes, result.file.size);
    assert.equal(test.canvas().width, 1600); assert.equal(test.canvas().height, 1200);
    assert.equal(test.draws.length, 1);
    assert.deepEqual(test.revoked, ['blob:local-fixture']);
  }
  const small = setup({ width: 30, height: 40 });
  await small.compress(input());
  assert.equal(small.canvas().width, 30); assert.equal(small.canvas().height, 40);
  for (const options of [{ unreadable: true }, { noContext: true }, { nullBlob: true },
    { bytes: '' }, { type: 'text/html' }, { width: 0 }, { height: Infinity },
    { bytes: new Uint8Array(2 * 1024 * 1024 + 1) }]) {
    const test = setup(options);
    await assert.rejects(test.compress(input()));
    assert.deepEqual(test.revoked, ['blob:local-fixture']);
  }
  for (const file of [new File([], 'empty.jpg', { type: 'image/jpeg' }),
    new File(['text'], 'wrong.svg', { type: 'image/svg+xml' }),
    new File([new Uint8Array(40 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' })]) {
    const test = setup();
    await assert.rejects(test.compress(file));
    assert.equal(test.created.length, 0, 'Invalid input must fail before decoding');
  }
  console.log('PASS — actual compressor with simulated browser encoders: WebP/PNG/JPEG, dimensions, private filename, invalid and empty images, size limits, URL cleanup.');
})().catch(error => { console.error(error); process.exitCode = 1; });
