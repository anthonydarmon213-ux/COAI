// Read-only gate for the exercise library's broadly compatible H.264 delivery files.
// Requires ffprobe. Originals belong in the source archive, not the delivery folder.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const directory = path.resolve(__dirname, '../public/videos/exercices');
const files = fs.readdirSync(directory).filter(file => file.endsWith('.mp4'));
let failures = 0;
for (const file of files) {
  const { streams } = JSON.parse(execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-show_entries',
    'stream=codec_name,profile,pix_fmt', '-of', 'json', path.join(directory, file),
  ], { encoding: 'utf8' }));
  const video = streams[0];
  if (!video || video.codec_name !== 'h264' || video.pix_fmt !== 'yuv420p') {
    console.error(`INCOMPATIBLE: ${file} (${video?.profile}, ${video?.pix_fmt})`);
    failures++;
  }
}
if (failures) process.exitCode = 1;
else console.log(`PASS: ${files.length} exercise videos use H.264 8-bit 4:2:0`);
