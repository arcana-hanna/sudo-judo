// Unit-Tests für die Prüfung unfertiger Aufgaben. Aufruf: npm run test:validate
import { validate } from '../src/shared/validate.ts';
import { sampleProject, blankProject, templates } from '../src/editor/templates.ts';
import { cloneWithNewIds } from '../src/editor/clone.ts';
import assert from 'node:assert/strict';
const ok = (n) => console.log('PASS', n);

assert.deepEqual(validate(sampleProject()).map((i) => i.message), []); ok('sample project has no issues');
for (const t of templates) assert.deepEqual(validate({ pages: [t.make('x')] }), [], t.id);
ok('every template is valid on its own');

assert.deepEqual(validate(blankProject()), []); ok('blank project starts without any hints');
assert.ok(validate({ pages: [{ id: 'p', title: 'T', blocks: [{ id: 'b', type: 'text', text: ' ' }] }] }).some((i) => i.message === 'Der Text ist leer.')); ok('empty text is still reported');

const p = sampleProject();
const find = (type) => p.pages.flatMap((pg) => pg.blocks).find((b) => b.type === type);
const mc = find('mc'); mc.options.forEach((o) => (o.correct = false)); mc.question = ' ';
let msgs = validate(p).map((i) => i.message);
assert.ok(msgs.includes('Die Aufgabenstellung fehlt.') && msgs.includes('Es ist keine richtige Antwort markiert.')); ok('mc: no question / no correct answer');

const g = p.pages.flatMap((pg) => pg.blocks).find((b) => b.type === 'graph');
g.colors = 2;
assert.ok(validate(p).some((i) => i.message.includes('nicht färben'))); ok('graph: unsolvable colouring detected');

const r = p.pages.flatMap((pg) => pg.blocks).find((b) => b.type === 'robot' && b.mode === 'build');
r.world.cells[1 * r.world.cols + 3] = 1;       // Wand auf dem Weg
assert.ok(validate(p).some((i) => i.message.includes('Musterlösung erreicht das Ziel nicht'))); ok('robot: broken model solution detected');
r.world.cells[1 * r.world.cols + 3] = 0; r.maxBlocks = 1;
assert.ok(validate(p).some((i) => i.message.includes('mehr Blöcke als erlaubt'))); ok('robot: model solution exceeds block limit');

const img = { id: 'i', type: 'image', src: 'data:x', alt: '' };
p.pages[0].blocks.push(img);
assert.ok(validate(p).some((i) => i.message.includes('Bildbeschreibung'))); ok('image: missing alt text');

// Klonen: neue IDs, Verweise bleiben konsistent
const orig = templates.find((t) => t.id === 'graph').make('G').blocks[0];
const copy = cloneWithNewIds(orig);
assert.notEqual(copy.id, orig.id);
assert.ok(copy.edges.every((e) => copy.nodes.some((n) => n.id === e.a) && copy.nodes.some((n) => n.id === e.b)));
assert.ok(copy.nodes.every((n) => !orig.nodes.some((o) => o.id === n.id)));
ok('clone: graph edges point to the copy’s own nodes');
const sortOrig = templates.find((t) => t.id === 'sort').make('S').blocks[0];
const sortCopy = cloneWithNewIds(sortOrig);
assert.ok(sortCopy.items.every((i) => sortCopy.categories.some((c) => c.id === i.cat))); ok('clone: sort categories remapped');

// ---- Reihenfolge mit Regeln ----
import { satisfies, oneValidOrder, countValidOrders, sameSet } from '../src/shared/order.ts';
const ids = ['a', 'b', 'c', 'd'];
const rules = [{ a: 'a', b: 'c' }, { a: 'b', b: 'c' }];           // c nach a und b; d frei
assert.equal(countValidOrders(ids, rules), 8); ok('rules: counts valid orders (4!/3 = 8)');
assert.ok(satisfies(['b', 'a', 'c', 'd'], rules) && !satisfies(['c', 'a', 'b', 'd'], rules)); ok('rules: satisfies');
assert.deepEqual(oneValidOrder(ids, rules), ['a', 'b', 'c', 'd']); ok('rules: stable topological order');
assert.equal(oneValidOrder(['a', 'b'], [{ a: 'a', b: 'b' }, { a: 'b', b: 'a' }]), null);
assert.equal(countValidOrders(['a', 'b'], [{ a: 'a', b: 'b' }, { a: 'b', b: 'a' }]), 0); ok('rules: contradiction detected');
assert.equal(countValidOrders(['x', 'y', 'z'], []), 6); ok('rules: no rules = all permutations');
assert.ok(sameSet([1, 2, 3], [3, 1, 2]) && !sameSet([1, 2], [1, 2, 3])); ok('sameSet');

// ---- Neue Aufgabentypen: Prüfung ----
{
  const mk = (b) => ({ pages: [{ id: 'p', title: 'T', blocks: [b] }] });
  const msgs = (b) => validate(mk(b)).map((i) => i.message);
  const seqEmpty = { id: 's', type: 'seq', question: 'q', tokens: [{ id: 'a', text: 'x' }, { id: 'b', text: '' }], answers: [[]], maxLen: 3, hint: '' };
  let m = msgs(seqEmpty);
  assert.ok(m.includes('Mindestens ein Baustein ist leer.') && m.some((x) => x.includes('keine richtige Folge'))); ok('seq: empty token and no answer reported');
  m = msgs({ ...seqEmpty, tokens: [{ id: 'a', text: 'x' }, { id: 'b', text: 'y' }], answers: [['a', 'b', 'a', 'b']] });
  assert.ok(m.some((x) => x.includes('länger als die erlaubte'))); ok('seq: answer longer than maxLen');

  const slots = { id: 'l', type: 'slots', question: 'q', layout: 'text', input: 'drag', text: 'a ___ b', bg: '', bgAlt: '',
    tokens: [{ id: 't', text: 'x' }], slots: [{ id: 's1', label: '', x: 0, y: 0, accept: ['t'] }, { id: 's2', label: '', x: 0, y: 0, accept: ['t'] }], hint: '' };
  m = msgs(slots);
  assert.ok(m.some((x) => x.includes('Lücken')) && m.some((x) => x.includes('mehr Exemplare'))); ok('slots: hole/slot mismatch and too few copies');
  m = msgs({ ...slots, layout: 'image', bg: 'data:x', bgAlt: '', slots: [{ id: 's1', label: '', x: 0, y: 0, accept: [] }] });
  assert.ok(m.some((x) => x.includes('Beschreibung des Hintergrundbilds')) && m.some((x) => x.includes('keine richtige Karte'))); ok('slots: image alt text and empty accept');

  const cellsB = { id: 'c', type: 'cells', question: 'q', rows: 2, cols: 2, bg: '', bgAlt: '', aspect: 1, walls: [], start: null, goal: null, answers: [[]], hint: '' };
  assert.ok(msgs(cellsB).some((x) => x.includes('keine richtigen Felder'))); ok('cells: no answer marked');

  const mcImg = { id: 'm', type: 'mc', question: 'q', hint: '', options: [{ id: 'a', text: '', img: 'data:x', correct: true }, { id: 'b', text: 'b', correct: false }] };
  m = msgs(mcImg);
  assert.ok(m.some((x) => x.includes('Bild-Antworten')) && !m.includes('Mindestens eine Antwort ist leer.')); ok('mc: image-only option needs a text, but is not "empty"');

  const rulesB = { id: 'o', type: 'order', mode: 'rules', question: 'q', hint: '', items: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }], rules: [{ a: 'a', b: 'b' }, { a: 'b', b: 'a' }] };
  assert.ok(msgs(rulesB).some((x) => x.includes('widersprechen'))); ok('order rules: contradiction reported');
  assert.ok(msgs({ ...rulesB, rules: [] }).some((x) => x.includes('keine Regeln'))); ok('order rules: no rules reported');
}

// ---- Vorlagen: stimmen die Lösungen wirklich? (unabhängig nachgerechnet) ----
{
  const tpl = (id) => templates.find((t) => t.id === id).make('x').blocks[0];

  // Felder: kürzester Weg per Breitensuche, eindeutig und gleich der hinterlegten Lösung
  const c = tpl('cells');
  const blocked = (x, y, nx, ny) => {
    const [ax, ay, bx, by] = x <= nx && y <= ny ? [x, y, nx, ny] : [nx, ny, x, y];
    return c.walls.includes(bx > ax ? `${ax},${ay},r` : `${ax},${ay},b`);
  };
  const paths = [];
  const dfs = (x, y, path) => {
    if (x === c.goal.x && y === c.goal.y) { paths.push([...path]); return; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= c.cols || ny >= c.rows || path.includes(ny * c.cols + nx) || blocked(x, y, nx, ny)) continue;
      path.push(ny * c.cols + nx); dfs(nx, ny, path); path.pop();
    }
  };
  dfs(c.start.x, c.start.y, [c.start.y * c.cols + c.start.x]);
  const best = Math.min(...paths.map((p) => p.length));
  const shortest = paths.filter((p) => p.length === best);
  assert.equal(shortest.length, 1); assert.deepEqual([...shortest[0]].sort(), [...c.answers[0]].sort()); ok('template cells: stored answer = the unique shortest path');

  // Gerichteter Graph: kürzester Weg A -> D
  const g = tpl('graph-directed');
  const A = g.nodes.find((n) => n.label === 'A').id, D = g.nodes.find((n) => n.label === 'D').id;
  const routes = [];
  const walk = (at, used, cost) => {
    if (at === D) { routes.push({ used: [...used], cost }); return; }
    for (const e of g.edges.filter((e) => e.a === at && !used.includes(e.id))) walk(e.b, [...used, e.id], cost + Number(e.w));
  };
  walk(A, [], 0);
  const min = Math.min(...routes.map((r) => r.cost));
  const bestRoutes = routes.filter((r) => r.cost === min);
  assert.equal(bestRoutes.length, 1); assert.deepEqual([...bestRoutes[0].used].sort(), [...g.target].sort()); ok(`template graph-directed: stored answer = unique shortest route (${min} km)`);

  // Folge: beide Antworten ergeben die Summe 6
  const sq = tpl('seq');
  const val = (id) => Number(sq.tokens.find((t) => t.id === id).text);
  assert.ok(sq.answers.every((a) => a.reduce((s, id) => s + val(id), 0) === 6) && sq.answers.length === 2); ok('template seq: both answers sum to 6');

  // Regeln: mehrere, aber nicht alle Reihenfolgen richtig
  const o = tpl('order-rules');
  const n = countValidOrders(o.items.map((i) => i.id), o.rules);
  assert.ok(n > 1 && n < 120); ok(`template order-rules: ${n} of 120 orders are valid`);
}

// ---- Speicher: Namensraum "sudo-judo:" mit Übernahme der alten "raetselbox:"-Einträge ----
import { readStored, writeStored } from '../src/shared/storage.ts';
{
  const mem = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; };
  const s = mem();
  s.setItem('raetselbox:progress:abc', '["a","b"]');
  assert.equal(readStored('progress:abc', s), '["a","b"]'); ok('storage: old entry is still readable');
  assert.equal(s.getItem('sudo-judo:progress:abc'), '["a","b"]'); assert.equal(s.getItem('raetselbox:progress:abc'), null); ok('storage: old entry migrated to the new key and removed');
  s.setItem('raetselbox:editor-draft', 'ALT'); s.setItem('sudo-judo:editor-draft', 'NEU');
  assert.equal(readStored('editor-draft', s), 'NEU'); assert.equal(s.getItem('raetselbox:editor-draft'), 'ALT'); ok('storage: a newer entry wins and the old one is left untouched');
  assert.equal(readStored('nothing', s), null); ok('storage: missing key -> null');
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.equal(readStored('x', broken), null); assert.equal(writeStored('x', 'y', broken), false); ok('storage: blocked storage fails quietly');
  const quota = { ...mem(), setItem() { throw new Error('quota'); } };
  quota.getItem = (k) => (k === 'raetselbox:q' ? 'v' : null);
  assert.equal(readStored('q', quota), 'v'); ok('storage: if migrating fails the value is still returned (and old entry kept)');
}

// ---- Gürtel: Fortschritt und Schwierigkeit ----
import { beltFor, neededFor, nextBelt, beltName, beltAdj, BELTS } from '../src/shared/belts.ts';
{
  assert.equal(BELTS.length, 7); ok('belts: seven belts, white to black');
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((d) => beltFor(d, 7)), [0, 0, 1, 2, 3, 4, 5, 6]); ok('belts: progress for 7 tasks (black only when all solved)');
  assert.equal(beltFor(0, 0), 0); assert.equal(beltFor(5, 5), 6); assert.equal(beltFor(1, 6), 1); ok('belts: edge cases (no tasks, 6 tasks = one belt each)');
  for (const total of [1, 2, 3, 5, 7, 10, 12, 24]) for (let d = 0; d <= total; d++) {
    const r = beltFor(d, total);
    assert.ok(d >= neededFor(r, total) && (r === 6 || d < neededFor(r + 1, total)), `consistent at ${d}/${total}`);
  }
  ok('belts: neededFor is consistent with beltFor for many sizes');
  assert.deepEqual(nextBelt(1, 7), { belt: 1, missing: 1 }); assert.deepEqual(nextBelt(2, 7), { belt: 2, missing: 1 }); assert.equal(nextBelt(7, 7), null);
  assert.ok(nextBelt(0, 12).missing === 2); ok('belts: next belt and missing tasks');
  assert.equal(beltName(1), 'Gelb'); assert.equal(beltAdj(6), 'Schwarzer'); assert.equal(beltName(99), 'Schwarz'); assert.equal(beltName(-3), 'Weiß'); ok('belts: names and clamping');
}

// Blockierter Speicher: schon der Zugriff auf localStorage kann scheitern (hier: gar nicht vorhanden)
assert.equal(readStored('anything'), null); assert.equal(writeStored('anything', 'x'), false); ok('storage: global localStorage unavailable -> no crash');
