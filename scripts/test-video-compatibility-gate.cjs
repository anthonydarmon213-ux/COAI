const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'check-video-compatibility.cjs'), 'utf8');
function run(files, video) {
  const state = {}, logs = [];
  vm.runInNewContext(source, {
    __dirname, process: state,
    console: { log: value => logs.push(value), error: () => {} },
    require: name => {
      if (name === 'node:fs') return { readdirSync: () => files };
      if (name === 'node:path') return path;
      if (name === 'node:child_process') return { execFileSync: () => JSON.stringify({ streams: video ? [video] : [] }) };
      throw Error(name);
    },
  });
  return { code: state.exitCode ?? 0, logs };
}
assert.throws(() => run([]), /No exercise videos/);
assert.throws(() => run(['README.md']), /No exercise videos/);
for (const video of [undefined, { codec_name: 'hevc', pix_fmt: 'yuv420p' }, { codec_name: 'h264', pix_fmt: 'yuv420p10le' }]) {
  const result = run(['fixture.mp4'], video);
  assert.equal(result.code, 1); assert.equal(result.logs.length, 0);
}
assert.equal(run(['fixture.mp4'], { codec_name: 'h264', pix_fmt: 'yuv420p' }).code, 0);
console.log('PASS video gate: empty library, missing stream and incompatible formats rejected; compatible fixture accepted.');
