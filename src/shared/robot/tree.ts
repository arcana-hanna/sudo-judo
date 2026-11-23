import { uid, type Cond, type Program, type Stmt, type StmtType } from '../types.ts';

export const defaultCond = (vars: string[]): Cond =>
  ({ kind: 'wallAhead', not: false, v: vars[0] ?? '', op: '<', val: { v: '', n: 3 } });

export function newStmt(t: StmtType, vars: string[], prog: Program): Stmt {
  const id = uid();
  switch (t) {
    case 'move': case 'left': case 'right': return { id, t };
    case 'repeat': return { id, t, n: { v: '', n: 3 }, body: [] };
    case 'if': return { id, t, c: defaultCond(vars), then: [] };
    case 'ifelse': return { id, t, c: defaultCond(vars), then: [], else: [] };
    case 'while': return { id, t, c: { ...defaultCond(vars), kind: 'onGoal', not: true }, body: [] };
    case 'set': return { id, t, v: vars[0] ?? '', val: { v: '', n: 0 } };
    case 'change': return { id, t, v: vars[0] ?? '', val: { v: '', n: 1 } };
    case 'call': return { id, t, f: prog.defs[0]?.id ?? '' };
  }
}

/** Alle Teillisten eines Blocks (Schleifenrumpf, Dann-/Sonst-Zweig). */
export function childLists(s: Stmt): Stmt[][] {
  if (s.t === 'repeat' || s.t === 'while') return [s.body];
  if (s.t === 'if') return [s.then];
  if (s.t === 'ifelse') return [s.then, s.else];
  return [];
}

const allLists = (p: Program): Stmt[][] => [p.main, ...p.defs.map((d) => d.body)];

export function findStmt(p: Program, id: string): Stmt | null {
  const walk = (list: Stmt[]): Stmt | null => {
    for (const s of list) {
      if (s.id === id) return s;
      for (const l of childLists(s)) { const r = walk(l); if (r) return r; }
    }
    return null;
  };
  for (const l of allLists(p)) { const r = walk(l); if (r) return r; }
  return null;
}

export function removeById(p: Program, id: string): boolean {
  const walk = (list: Stmt[]): boolean => {
    const i = list.findIndex((s) => s.id === id);
    if (i >= 0) { list.splice(i, 1); return true; }
    return list.some((s) => childLists(s).some(walk));
  };
  return allLists(p).some(walk);
}

/** Liegt `list` innerhalb von `s`? (Verhindert, einen Block in sich selbst zu ziehen.) */
export function containsList(s: Stmt, list: Stmt[]): boolean {
  return childLists(s).some((l) => l === list || l.some((c) => containsList(c, list)));
}

export function countBlocks(p: Program): number {
  const count = (list: Stmt[]): number =>
    list.reduce((n, s) => n + 1 + childLists(s).reduce((m, l) => m + count(l), 0), 0);
  return allLists(p).reduce((n, l) => n + count(l), 0);
}

export const emptyProgram = (): Program => ({ main: [], defs: [] });

export function condText(c: Cond): string {
  const base = c.kind === 'wallAhead' ? 'Wand voraus' : c.kind === 'wallLeft' ? 'Wand links'
    : c.kind === 'wallRight' ? 'Wand rechts' : c.kind === 'onGoal' ? 'am Ziel'
    : `${c.v} ${c.op} ${c.val.v || c.val.n}`;
  return c.not ? `nicht ${base}` : base;
}
