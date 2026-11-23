import type { Cond, Program, Stmt, Val, World } from '../types.ts';

export interface Step {
  x: number; y: number; dir: number;
  vars: Record<string, number>;
  id: string | null;      // zuletzt ausgeführter Block (zum Hervorheben)
  bump?: boolean;         // Roboter ist gegen eine Wand gefahren
}
export interface RunResult { status: 'ok' | 'crash' | 'timeout'; trace: Step[]; final: Step }

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
class Stop extends Error {
  status: 'crash' | 'timeout';
  constructor(status: 'crash' | 'timeout') { super(status); this.status = status; }
}

/** Führt ein Programm aus und liefert die komplette Spur (für die Animation). */
export function simulate(p: Program, w: World, varNames: string[], maxSteps = 3000): RunResult {
  let x = w.start.x, y = w.start.y, dir = w.start.dir;
  const vars: Record<string, number> = Object.fromEntries(varNames.map((n) => [n, 0]));
  const snap = (id: string | null, bump = false): Step => ({ x, y, dir, vars: { ...vars }, id, bump });
  const trace: Step[] = [snap(null)];
  let steps = 0;

  const blocked = (cx: number, cy: number) =>
    cx < 0 || cy < 0 || cx >= w.cols || cy >= w.rows || w.cells[cy * w.cols + cx] === 1;
  const val = (a: Val) => (a.v ? vars[a.v] ?? 0 : a.n);
  const tick = () => { if (++steps > maxSteps) throw new Stop('timeout'); };

  function cond(c: Cond): boolean {
    let r: boolean;
    switch (c.kind) {
      case 'wallAhead': r = blocked(x + DX[dir], y + DY[dir]); break;
      case 'wallLeft': { const d = (dir + 3) % 4; r = blocked(x + DX[d], y + DY[d]); break; }
      case 'wallRight': { const d = (dir + 1) % 4; r = blocked(x + DX[d], y + DY[d]); break; }
      case 'onGoal': r = w.cells[y * w.cols + x] === 2; break;
      default: {
        const a = vars[c.v] ?? 0, b = val(c.val);
        r = c.op === '<' ? a < b : c.op === '>' ? a > b : c.op === '==' ? a === b : a !== b;
      }
    }
    return c.not ? !r : r;
  }

  function exec(list: Stmt[], depth: number) {
    for (const s of list) {
      tick();
      switch (s.t) {
        case 'move': {
          const nx = x + DX[dir], ny = y + DY[dir];
          if (blocked(nx, ny)) { trace.push(snap(s.id, true)); throw new Stop('crash'); }
          x = nx; y = ny; trace.push(snap(s.id)); break;
        }
        case 'left': dir = (dir + 3) % 4; trace.push(snap(s.id)); break;
        case 'right': dir = (dir + 1) % 4; trace.push(snap(s.id)); break;
        case 'repeat': { const n = Math.max(0, Math.min(1000, val(s.n))); for (let i = 0; i < n; i++) exec(s.body, depth); break; }
        case 'if': if (cond(s.c)) exec(s.then, depth); break;
        case 'ifelse': exec(cond(s.c) ? s.then : s.else, depth); break;
        case 'while': while (cond(s.c)) { exec(s.body, depth); tick(); } break;
        case 'set': if (s.v) { vars[s.v] = val(s.val); trace.push(snap(s.id)); } break;
        case 'change': if (s.v) { vars[s.v] = (vars[s.v] ?? 0) + val(s.val); trace.push(snap(s.id)); } break;
        case 'call': {
          const d = p.defs.find((d) => d.id === s.f);
          if (!d) break;
          if (depth >= 64) throw new Stop('timeout');
          exec(d.body, depth + 1); break;
        }
      }
    }
  }

  let status: RunResult['status'] = 'ok';
  try { exec(p.main, 0); } catch (e) { if (e instanceof Stop) status = e.status; else throw e; }
  return { status, trace, final: trace[trace.length - 1] };
}
