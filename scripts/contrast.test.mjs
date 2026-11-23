// WCAG-Kontrasttest (AA, 4.5:1) für alle Farbpaare aus theme.css und palette.ts.
import { readFileSync } from 'node:fs';
import { NODE_FILL, NODE_TEXT } from '../src/shared/palette.ts';
import assert from 'node:assert/strict';

const css = readFileSync(new URL('../src/shared/theme.css', import.meta.url), 'utf8');
const t = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const pairs = [
  ['ink', 'paper'], ['muted', 'paper'], ['muted', 'wash'], ['accent', 'paper'], ['accent', 'wash'],
  ['accent-ink', 'accent'], ['good', 'paper'], ['good', 'good-wash'], ['bad', 'paper'], ['bad', 'bad-wash'],
  ['ink', 'blk-hat'],
  ...['blk-motion', 'blk-control', 'blk-vars', 'blk-my'].map((b) => ['paper', b]),
].map(([f, b]) => [f, b, t[f], t[b]]);
NODE_FILL.forEach((bg, i) => pairs.push([`node-text-${i}`, `node-fill-${i}`, NODE_TEXT[i], bg]));

let bad = 0;
for (const [f, b, fh, bh] of pairs) {
  assert.ok(fh && bh, `Farbe fehlt: ${f} / ${b}`);
  const r = ratio(fh, bh);
  if (r < 4.5) { bad++; console.log(`FAIL ${r.toFixed(2)} ${f} auf ${b}`); }
}
assert.equal(bad, 0);
console.log(`PASS ${pairs.length} colour pairs meet WCAG AA`);
