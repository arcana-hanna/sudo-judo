// Unit-Tests für Simulator und Python-Ausgabe. Aufruf: npm run test:robot (Node >= 22)
import { simulate } from '../src/shared/robot/sim.ts';
import { toPython } from '../src/shared/robot/python.ts';
import { newStmt, countBlocks, removeById, findStmt, containsList } from '../src/shared/robot/tree.ts';
import assert from 'node:assert/strict';

const world = (rows, cols, walls = [], goal = null, start = { x: 0, y: 0, dir: 1 }) => {
  const cells = new Array(rows * cols).fill(0);
  walls.forEach(([x, y]) => (cells[y * cols + x] = 1));
  if (goal) cells[goal[1] * cols + goal[0]] = 2;
  return { rows, cols, cells, start };
};
const prog = (main = [], defs = []) => ({ main, defs });
let n = 0; const id = () => 's' + n++;
const move = () => ({ id: id(), t: 'move' });
const left = () => ({ id: id(), t: 'left' });
const right = () => ({ id: id(), t: 'right' });
const num = (k) => ({ v: '', n: k });
const sensor = (kind, not = false) => ({ kind, not, v: '', op: '<', val: num(0) });
const ok = (name) => console.log('PASS', name);

// Wiederholung + Bewegung
let r = simulate(prog([{ id: id(), t: 'repeat', n: num(3), body: [move()] }]), world(1, 5), []);
assert.equal(r.status, 'ok'); assert.equal(r.final.x, 3); ok('repeat 3 x move');

// Drehung
r = simulate(prog([right(), move()]), world(3, 3), []);
assert.deepEqual([r.final.x, r.final.y, r.final.dir], [0, 1, 2]); ok('turn right then move');
r = simulate(prog([left(), left(), left(), left()]), world(2, 2), []);
assert.equal(r.final.dir, 1); ok('four left turns = identity');

// Wand und Rand => Absturz (Position bleibt vor der Wand)
r = simulate(prog([move(), move(), move()]), world(1, 5, [[2, 0]]), []);
assert.equal(r.status, 'crash'); assert.equal(r.final.x, 1); assert.ok(r.final.bump); ok('crash into wall');
r = simulate(prog([left(), move()]), world(3, 3), []);
assert.equal(r.status, 'crash'); ok('crash at border');

// while + Sensor: bis zum Ziel laufen
r = simulate(prog([{ id: id(), t: 'while', c: sensor('onGoal', true), body: [move()] }]), world(1, 6, [], [4, 0]), []);
assert.equal(r.status, 'ok'); assert.equal(r.final.x, 4); ok('while not on goal');

// if/else mit Sensor: Wand-Folger
const wf = { id: id(), t: 'ifelse', c: sensor('wallAhead'), then: [right()], else: [move()] };
r = simulate(prog([{ id: id(), t: 'repeat', n: num(4), body: [wf] }]), world(3, 3, [[2, 0]]), []);
assert.equal(r.status, 'ok'); assert.deepEqual([r.final.x, r.final.y], [1, 2]); ok("if/else with sensor");

// Variablen, Vergleich, Zähler
const loop = { id: id(), t: 'while', c: { kind: 'cmp', not: false, v: 'x', op: '<', val: num(4) },
  body: [{ id: id(), t: 'change', v: 'x', val: num(1) }, move()] };
r = simulate(prog([loop]), world(1, 9), ['x']);
assert.equal(r.final.vars.x, 4); assert.equal(r.final.x, 4); ok('variable loop');
r = simulate(prog([{ id: id(), t: 'set', v: 'x', val: num(2) }, { id: id(), t: 'repeat', n: { v: 'x', n: 0 }, body: [move()] }]), world(1, 9), ['x']);
assert.equal(r.final.x, 2); ok('repeat with variable count');

// Eigene Blöcke (Funktionen), Rekursionsschutz, Endlosschleife
const sq = { id: 'f1', name: 'Quadrat', body: [move(), right()] };
r = simulate(prog([{ id: id(), t: 'repeat', n: num(4), body: [{ id: id(), t: 'call', f: 'f1' }] }], [sq]), world(3, 3), []);
assert.deepEqual([r.final.x, r.final.y, r.final.dir], [0, 0, 1]); ok('function call (square)');
const rec = { id: 'f2', name: 'rec', body: [{ id: id(), t: 'call', f: 'f2' }] };
r = simulate(prog([{ id: id(), t: 'call', f: 'f2' }], [rec]), world(1, 1), []);
assert.equal(r.status, 'timeout'); ok('infinite recursion stops');
r = simulate(prog([{ id: id(), t: 'while', c: sensor('wallAhead', true), body: [] }]), world(1, 1, [[0, 0]]), []);
r = simulate(prog([{ id: id(), t: 'while', c: sensor('onGoal', true), body: [] }]), world(1, 1), []);
assert.equal(r.status, 'timeout'); ok('empty infinite while stops');

// Baum-Operationen
const p = prog([{ id: 'a', t: 'repeat', n: num(2), body: [{ id: 'b', t: 'move' }, { id: 'c', t: 'if', c: sensor('onGoal'), then: [{ id: 'd', t: 'left' }] }] }]);
assert.equal(countBlocks(p), 4); ok('countBlocks');
assert.ok(containsList(findStmt(p, 'a'), findStmt(p, 'c').then)); ok('containsList');
assert.ok(removeById(p, 'd')); assert.equal(countBlocks(p), 3); ok('removeById nested');

// Python-Ausgabe
const py = toPython(prog(
  [{ id: id(), t: 'set', v: 'x', val: num(0) },
   { id: id(), t: 'repeat', n: num(3), body: [{ id: id(), t: 'call', f: 'f1' }, { id: id(), t: 'change', v: 'x', val: num(-1) }] },
   { id: id(), t: 'ifelse', c: sensor('wallAhead', true), then: [move()], else: [] }],
  [{ id: 'f1', name: 'Mein Block 1', body: [move(), { id: id(), t: 'change', v: 'x', val: num(1) }, right()] }]), ['x']);
assert.equal(py, [
  'x = 0', '',
  'def mein_block_1():', '    global x', '    move()', '    x += 1', '    turn_right()', '',
  'x = 0', 'for _ in range(3):', '    mein_block_1()', '    x -= 1',
  'if not wall_ahead():', '    move()', 'else:', '    pass'].join('\n'));
ok('python output');
