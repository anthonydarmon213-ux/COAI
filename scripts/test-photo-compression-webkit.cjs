const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
// Build a valid 2x1 PNG containing a private synthetic metadata marker.
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, payload) {
  const body = Buffer.concat([Buffer.from(type), payload]);
  const length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(payload.length); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(2, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 2;
const marker = 'COAI_PRIVATE_SYNTHETIC_METADATA';
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header),
  chunk('tEXt', Buffer.from(`Comment\0${marker}`)),
  chunk('IDAT', zlib.deflateSync(Buffer.from([0,255,0,0,0,255,0]))), chunk('IEND', Buffer.alloc(0))]);
assert.ok(png.includes(marker));
const source = fs.readFileSync(path.join(root, 'src/lib/images/compress-progress-photo.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'coai-photo-webkit-'));
try {
  const inputPNG = path.join(directory, 'synthetic.png');
  const inputHEIC = path.join(directory, 'synthetic.heic');
  fs.writeFileSync(inputPNG, png);
  execFileSync('/usr/bin/sips', ['-s', 'format', 'heic', inputPNG, '--out', inputHEIC], { stdio: 'pipe' });
  const heic = fs.readFileSync(inputHEIC);
  assert(heic.subarray(4, 32).includes('ftyp'), 'Fixture must be an encoded HEIF container');
  const script = `(function() {
  const exports = {};
  ${compiled}
  (async () => {
    const check = (value, message) => { if (!value) throw new Error(message); };
    const bytes = Uint8Array.from(atob(${JSON.stringify(png.toString('base64'))}), c => c.charCodeAt(0));
    const input = new File([bytes], 'private-location.png', { type: 'image/png' });
    async function verify(forcePNG, photo = input) {
      const original = HTMLCanvasElement.prototype.toBlob;
      if (forcePNG) HTMLCanvasElement.prototype.toBlob = function(callback) { return original.call(this, callback, 'image/png'); };
      let result;
      try { result = await exports.compressProgressPhoto(photo); }
      finally { HTMLCanvasElement.prototype.toBlob = original; }
      check(result.file.name.startsWith('coai-photo.'), 'Private source filename forwarded');
      const data = new Uint8Array(await result.file.arrayBuffer());
      check(!new TextDecoder().decode(data).includes(${JSON.stringify(marker)}), 'Source metadata retained');
      if (forcePNG) {
        check(result.file.type === 'image/png' && result.file.name === 'coai-photo.png', 'PNG fallback mislabeled');
        check(data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71, 'Invalid PNG signature');
      }
      const url = URL.createObjectURL(result.file);
      try {
        const image = new Image();
        await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
        check(image.naturalWidth === 2 && image.naturalHeight === 1, 'Dimensions changed');
        const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 1;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        if (forcePNG && photo === input) {
          check(Array.from(context.getImageData(0, 0, 2, 1).data).join(',') === '255,0,0,255,0,255,0,255', 'PNG pixels changed');
        }
        if (forcePNG && photo !== input) {
          const outputPixels = Array.from(context.getImageData(0, 0, 2, 1).data).join(',');
          const sourceURL = URL.createObjectURL(photo);
          try {
            const sourceImage = new Image();
            await new Promise((resolve, reject) => { sourceImage.onload = resolve; sourceImage.onerror = reject; sourceImage.src = sourceURL; });
            context.clearRect(0, 0, 2, 1); context.drawImage(sourceImage, 0, 0);
            check(outputPixels === Array.from(context.getImageData(0, 0, 2, 1).data).join(','), 'Decoded HEIC pixels changed');
          } finally { URL.revokeObjectURL(sourceURL); }
        }
      } finally { URL.revokeObjectURL(url); }
    }
    await verify(false); await verify(true);
    const heicBytes = Uint8Array.from(atob(${JSON.stringify(heic.toString('base64'))}), c => c.charCodeAt(0));
    for (const type of ['image/heic', 'image/heif']) {
      await verify(true, new File([heicBytes], 'private-location.heic', { type }));
    }
    window.webkit.messageHandlers.compressionResult.postMessage({ ok: true });
  })().catch(error => window.webkit.messageHandlers.compressionResult.postMessage({ ok: false, error: String(error) }));
})();`;
  const javascript = path.join(directory, 'fixture.js'), binary = path.join(directory, 'check');
  fs.writeFileSync(javascript, script);
  execFileSync('xcrun', ['--sdk', 'macosx', 'swiftc', '-parse-as-library', '-swift-version', '5',
    path.join(root, 'scripts/test-photo-compression-webkit.swift'), '-o', binary], { stdio: 'inherit' });
  execFileSync(binary, [javascript], { stdio: 'inherit', timeout: 45000 });
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
