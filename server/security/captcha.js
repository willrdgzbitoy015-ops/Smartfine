// A picture CAPTCHA made by SmartFine itself (no outside service, so it works
// on the school network). Shown when sign-in keeps failing after a lockout.
//
// Each CAPTCHA is a random string drawn as an SVG. The characters are drawn
// as strokes (paths) with random size, tilt and position, plus noise lines, so
// the answer is not sitting in the picture's text for a program to read. It
// works once and expires after 5 minutes; the answer is kept only as a keyed
// hash.
const crypto = require("node:crypto");

const { signingKey } = require("./secrets");

// No 0/O or 1/I, which look alike.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 5;
const LIFETIME_MS = 5 * 60 * 1000;
const MAX_LIVE = 2000;

// Each character as strokes in a box 8 wide and 12 high.
const GLYPHS = {
  A: "M0 12 L4 0 L8 12 M1.6 8 L6.4 8",
  B: "M0 0 L0 12 M0 0 L5 0 Q8 0 8 3 Q8 6 5 6 L0 6 M5 6 Q8.5 6 8.5 9 Q8.5 12 5 12 L0 12",
  C: "M8 2 Q6 0 4 0 Q0 0 0 6 Q0 12 4 12 Q6 12 8 10",
  D: "M0 0 L0 12 L3 12 Q8 12 8 6 Q8 0 3 0 L0 0",
  E: "M8 0 L0 0 L0 12 L8 12 M0 6 L6 6",
  F: "M8 0 L0 0 L0 12 M0 6 L6 6",
  G: "M8 2 Q6 0 4 0 Q0 0 0 6 Q0 12 4 12 Q8 12 8 7 L4.5 7",
  H: "M0 0 L0 12 M8 0 L8 12 M0 6 L8 6",
  J: "M8 0 L8 9 Q8 12 4 12 Q0 12 0 9",
  K: "M0 0 L0 12 M8 0 L0 7 M3 5 L8 12",
  L: "M0 0 L0 12 L8 12",
  M: "M0 12 L0 0 L4 7 L8 0 L8 12",
  N: "M0 12 L0 0 L8 12 L8 0",
  P: "M0 12 L0 0 L5 0 Q8 0 8 3 Q8 6.5 5 6.5 L0 6.5",
  Q: "M4 0 Q0 0 0 6 Q0 12 4 12 Q8 12 8 6 Q8 0 4 0 M5 8 L8.5 12.5",
  R: "M0 12 L0 0 L5 0 Q8 0 8 3 Q8 6.5 5 6.5 L0 6.5 M4.5 6.5 L8 12",
  S: "M8 2 Q6.5 0 4 0 Q0 0 0 3 Q0 5.5 4 6 Q8 6.5 8 9 Q8 12 4 12 Q1.5 12 0 10",
  T: "M0 0 L8 0 M4 0 L4 12",
  U: "M0 0 L0 8 Q0 12 4 12 Q8 12 8 8 L8 0",
  V: "M0 0 L4 12 L8 0",
  W: "M0 0 L2 12 L4 5 L6 12 L8 0",
  X: "M0 0 L8 12 M8 0 L0 12",
  Y: "M0 0 L4 6 L8 0 M4 6 L4 12",
  Z: "M0 0 L8 0 L0 12 L8 12",
  2: "M0 2.5 Q0 0 4 0 Q8 0 8 3.5 Q8 6 0 12 L8 12",
  3: "M0 1.5 Q2 0 4 0 Q8 0 8 3 Q8 5.5 3.5 6 Q8.5 6.5 8.5 9 Q8.5 12 4 12 Q1.5 12 0 10.5",
  4: "M6 12 L6 0 L0 8 L8.5 8",
  5: "M8 0 L1 0 L0.5 5.5 Q2 4.5 4 4.5 Q8.5 4.5 8.5 8.3 Q8.5 12 4 12 Q1.5 12 0 10.5",
  6: "M7.5 1 Q6 0 4 0 Q0 0 0 7 Q0 12 4 12 Q8 12 8 8 Q8 4.5 4 4.5 Q1 4.5 0.2 7",
  7: "M0 0 L8 0 L3 12",
  8: "M4 6 Q0 5.5 0 3 Q0 0 4 0 Q8 0 8 3 Q8 5.5 4 6 Q8.5 6.5 8.5 9 Q8.5 12 4 12 Q-0.5 12 -0.5 9 Q-0.5 6.5 4 6",
  9: "M0.5 11 Q2 12 4 12 Q8 12 8 5 Q8 0 4 0 Q0 0 0 4 Q0 7.5 4 7.5 Q7 7.5 7.8 5",
};

const live = new Map();

function hashAnswer(id, answer) {
  return crypto
    .createHmac("sha256", signingKey())
    .update(`captcha:${id}:${String(answer).trim().toUpperCase()}`)
    .digest("hex");
}

function pick(max) {
  return crypto.randomInt(0, max);
}

function between(low, high) {
  return low + crypto.randomInt(0, Math.round((high - low) * 100) + 1) / 100;
}

function noiseLine(width, height, color) {
  return `<path d="M${between(0, width)} ${between(0, height)} Q ${between(0, width)} ${between(0, height)} ${between(0, width)} ${between(0, height)}" stroke="${color}" stroke-width="${between(1, 2)}" fill="none" stroke-linecap="round"/>`;
}

function draw(text) {
  const width = 180;
  const height = 64;
  const colors = ["#173A73", "#2B5BA8", "#123266", "#1F6B3A", "#6A3FB5"];
  const parts = [];

  parts.push(`<rect width="${width}" height="${height}" rx="8" fill="#EEF2F8"/>`);

  // Noise behind the characters.
  for (let i = 0; i < 4; i += 1) {
    parts.push(noiseLine(width, height, ["#9AA8C4", "#B7C2D8", "#8FA0BF"][pick(3)]));
  }

  const step = (width - 28) / text.length;

  [...text].forEach((character, index) => {
    const scale = between(2.6, 3.3);
    const glyphWidth = 8 * scale;
    const x = 14 + index * step + between(0, Math.max(0, step - glyphWidth - 2));
    const y = (height - 12 * scale) / 2 + between(-4, 4);
    const rotate = between(-20, 20);

    parts.push(
      `<path d="${GLYPHS[character]}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rotate.toFixed(1)} ${(4 * scale).toFixed(1)} ${(6 * scale).toFixed(1)}) scale(${scale.toFixed(2)})" stroke="${colors[pick(colors.length)]}" stroke-width="${between(0.75, 1.05).toFixed(2)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  });

  // Lines crossing the characters, and speckle.
  for (let i = 0; i < 3; i += 1) {
    parts.push(noiseLine(width, height, ["#5F7299", "#7A8CAE", "#173A73"][pick(3)]));
  }

  for (let i = 0; i < 30; i += 1) {
    parts.push(`<circle cx="${between(0, width)}" cy="${between(0, height)}" r="${between(0.5, 1.5)}" fill="#8896B3"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;
}

function sweep() {
  const now = Date.now();

  for (const [id, entry] of live) {
    if (entry.expiresAt < now) live.delete(id);
  }

  // Never grow without limit: drop the oldest first.
  while (live.size > MAX_LIVE) {
    live.delete(live.keys().next().value);
  }
}

function randomText() {
  return Array.from({ length: LENGTH }, () => ALPHABET[pick(ALPHABET.length)]).join("");
}

// A new CAPTCHA: { captchaId, svg }. `options.text` only exists so tests can
// know the answer; the server never passes it.
function createCaptcha(options = {}) {
  sweep();

  const id = crypto.randomUUID();
  const text =
    typeof options.text === "string" && /^[A-Z2-9]{1,8}$/.test(options.text) ? options.text : randomText();

  live.set(id, { hash: hashAnswer(id, text), expiresAt: Date.now() + LIFETIME_MS });

  return { captchaId: id, svg: draw(text) };
}

// Checks an answer (letters in any case). The CAPTCHA is used up either way,
// so each guess needs a fresh picture.
function checkCaptcha(captchaId, answer) {
  const entry = live.get(String(captchaId || ""));

  live.delete(String(captchaId || ""));

  if (!entry || entry.expiresAt < Date.now()) {
    return false;
  }

  const given = Buffer.from(hashAnswer(captchaId, answer), "hex");
  const expected = Buffer.from(entry.hash, "hex");

  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

module.exports = { ALPHABET, checkCaptcha, createCaptcha, randomText };
