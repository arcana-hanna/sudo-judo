// WCAG-Kontrasttest (AA, 4,5:1) für beide Themes in hellem und dunklem Modus.
// Liest die mit "@theme NAME … @end" markierten Blöcke aus src/shared/theme.css.
import { readFileSync } from 'node:fs';
import { NODE_FILL, NODE_TEXT } from '../src/shared/palette.ts';
import assert from 'node:assert/strict';

const css = readFileSync(new URL('../src/shared/theme.css', import.meta.url), 'utf8');
const tokens = (text) => Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
const themes = Object.fromEntries([...css.matchAll(/\/\* @theme (\S+) \*\/([\s\S]*?)\/\* @end \*\//g)].map((m) => [m[1], tokens(m[2])]));
const shared = tokens(css.slice(0, css.indexOf('/* ===== Theme "klar"')));          // Blockfarben
assert.deepEqual(Object.keys(themes).sort(), ['dojo-dark', 'dojo-light', 'klar-dark', 'klar-light']);

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const pairs = [
  ['ink', 'paper'], ['ink', 'wash'], ['muted', 'paper'], ['muted', 'wash'], ['accent', 'paper'], ['accent', 'wash'],
  ['accent-ink', 'accent'], ['good', 'paper'], ['good', 'good-wash'], ['bad', 'paper'], ['bad', 'bad-wash'],
  ['on-good', 'good'], ['on-bad', 'bad'], ['bar-ink', 'bar-bg'], ['ink', 'cell0'], ['ink', 'good-wash'], ['ink', 'bad-wash'],
];
const resolve = (v, t) => { const m = /^var\(--([\w-]+)\)$/.exec(v); return m ? t[m[1]] : v; };

let checked = 0, bad = 0;
const check = (label, fg, bg) => {
  assert.ok(fg && bg, `Farbe fehlt: ${label}`);
  const r = ratio(fg, bg); checked++;
  if (r < 4.5) { bad++; console.log(`FAIL ${r.toFixed(2)} ${label}`); }
};
for (const [name, t] of Object.entries(themes)) {
  for (const [f, b] of pairs) check(`${name}: ${f} auf ${b}`, t[f], t[b]);
  NODE_FILL.forEach((bg, i) => check(`${name}: Knoten ${i}`, resolve(NODE_TEXT[i], t), resolve(bg, t)));
  check(`${name}: Auswahl-Knoten`, t['accent-ink'], t['accent']);
}
for (const b of ['blk-motion', 'blk-control', 'blk-vars', 'blk-my']) check(`Block ${b}: weiße Schrift`, '#ffffff', shared[b]);
check('Block-Kopf', shared['blk-hat-ink'], shared['blk-hat']);
assert.equal(bad, 0);
console.log(`PASS ${checked} colour pairs meet WCAG AA in 4 theme/mode combinations`);
