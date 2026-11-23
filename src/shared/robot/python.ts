import type { Cond, Program, Stmt, Val } from '../types.ts';
import { childLists } from './tree.ts';

const ident = (name: string, fallback: string) => {
  let s = name.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  if (!s) s = fallback;
  return /^[0-9]/.test(s) ? 'f_' + s : s;
};

/** Gibt das Blockprogramm als lesbaren Python-Code aus (Roboter-Funktionen siehe README). */
export function toPython(p: Program, vars: string[]): string {
  const names = new Map(p.defs.map((d, i) => [d.id, ident(d.name, 'block' + (i + 1))]));
  const val = (v: Val) => (v.v ? v.v : String(v.n));
  const cond = (c: Cond) => {
    const base = c.kind === 'wallAhead' ? 'wall_ahead()' : c.kind === 'wallLeft' ? 'wall_left()'
      : c.kind === 'wallRight' ? 'wall_right()' : c.kind === 'onGoal' ? 'on_goal()'
      : `${c.v} ${c.op} ${val(c.val)}`;
    if (!c.not) return base;
    if (c.kind === 'cmp') return `${c.v} ${({ '<': '>=', '>': '<=', '==': '!=', '!=': '==' })[c.op]} ${val(c.val)}`;
    return `not ${base}`;
  };
  const assigned = (list: Stmt[]): string[] =>
    list.flatMap((s) => [...(s.t === 'set' || s.t === 'change' ? [s.v] : []), ...childLists(s).flatMap(assigned)]);

  const block = (list: Stmt[], ind: string): string[] => {
    if (list.length === 0) return [ind + 'pass'];
    return list.flatMap((s): string[] => {
      switch (s.t) {
        case 'move': return [ind + 'move()'];
        case 'left': return [ind + 'turn_left()'];
        case 'right': return [ind + 'turn_right()'];
        case 'repeat': return [`${ind}for _ in range(${val(s.n)}):`, ...block(s.body, ind + '    ')];
        case 'if': return [`${ind}if ${cond(s.c)}:`, ...block(s.then, ind + '    ')];
        case 'ifelse': return [`${ind}if ${cond(s.c)}:`, ...block(s.then, ind + '    '), `${ind}else:`, ...block(s.else, ind + '    ')];
        case 'while': return [`${ind}while ${cond(s.c)}:`, ...block(s.body, ind + '    ')];
        case 'set': return [`${ind}${s.v || '_'} = ${val(s.val)}`];
        case 'change': return !s.val.v && s.val.n < 0
          ? [`${ind}${s.v || '_'} -= ${-s.val.n}`] : [`${ind}${s.v || '_'} += ${val(s.val)}`];
        case 'call': return [ind + (names.get(s.f) ?? 'pass') + '()'];
      }
    });
  };

  const out: string[] = vars.map((v) => `${v} = 0`);
  if (out.length) out.push('');
  for (const d of p.defs) {
    out.push(`def ${names.get(d.id)}():`);
    const g = [...new Set(assigned(d.body))].filter(Boolean);
    if (g.length) out.push(`    global ${g.join(', ')}`);
    out.push(...block(d.body, '    '), '');
  }
  out.push(...block(p.main, ''));
  return out.join('\n');
}
