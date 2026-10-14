// Writes assets/sounds/notice.wav: the short two-note chime that plays with the
// in-app notice banner. The sound is synthesized here, so there is nothing to
// license. Change the notes or timing below and run:
//   node scripts/make-notice-sound.js
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const DURATION = 0.75; // seconds
const PEAK = 0.55; // of full scale, so it is never harsh

// A soft bell: a note with a little of its 2nd and 3rd harmonics that fades
// away smoothly, starting at `start` seconds.
const NOTES = [
  { frequency: 880.0, start: 0.0, decay: 7 }, // A5
  { frequency: 1318.51, start: 0.13, decay: 5.5 }, // E6
];

const samples = new Float32Array(Math.round(SAMPLE_RATE * DURATION));

for (const note of NOTES) {
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / SAMPLE_RATE - note.start;

    if (t < 0) continue;

    const attack = Math.min(1, t / 0.006);
    const envelope = attack * Math.exp(-note.decay * t);
    const tone =
      Math.sin(2 * Math.PI * note.frequency * t) +
      0.28 * Math.sin(2 * Math.PI * note.frequency * 2 * t) +
      0.08 * Math.sin(2 * Math.PI * note.frequency * 3 * t);

    samples[i] += envelope * tone;
  }
}

// Fade the very end to silence and scale to the peak level.
const fadeOut = Math.round(SAMPLE_RATE * 0.05);
let max = 0;

for (let i = 0; i < samples.length; i += 1) {
  const left = samples.length - i;

  if (left < fadeOut) samples[i] *= left / fadeOut;

  max = Math.max(max, Math.abs(samples[i]));
}

const data = Buffer.alloc(samples.length * 2);

for (let i = 0; i < samples.length; i += 1) {
  data.writeInt16LE(Math.round((samples[i] / max) * PEAK * 32767), i * 2);
}

const header = Buffer.alloc(44);

header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16); // PCM
header.writeUInt16LE(1, 20); // format: PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const out = path.join(__dirname, "..", "assets", "sounds", "notice.wav");

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, data]));

console.log(`wrote ${out} (${header.length + data.length} bytes, ${DURATION}s)`);
