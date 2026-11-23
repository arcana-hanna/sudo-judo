import type { GraphEdge, GraphNode } from './types';

/** Findet eine gültige Färbung mit höchstens k Farben (Backtracking) oder null. */
export function solveColoring(nodes: GraphNode[], edges: GraphEdge[], k: number): Record<string, number> | null {
  const adj = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  for (const e of edges) { adj.get(e.a)?.push(e.b); adj.get(e.b)?.push(e.a); }
  // Knoten mit vielen Nachbarn zuerst – das beschleunigt die Suche deutlich.
  const order = [...nodes].sort((x, y) => adj.get(y.id)!.length - adj.get(x.id)!.length);
  const col: Record<string, number> = {};
  const go = (i: number): boolean => {
    if (i === order.length) return true;
    const id = order[i].id;
    for (let c = 1; c <= k; c++) {
      if (adj.get(id)!.some((nb) => col[nb] === c)) continue;
      col[id] = c;
      if (go(i + 1)) return true;
      delete col[id];
    }
    return false;
  };
  return go(0) ? col : null;
}

export function nextLabel(nodes: GraphNode[]): string {
  const used = new Set(nodes.map((n) => n.label));
  for (let i = 0; i < 26; i++) { const l = String.fromCharCode(65 + i); if (!used.has(l)) return l; }
  let n = 1; while (used.has('N' + n)) n++;
  return 'N' + n;
}
