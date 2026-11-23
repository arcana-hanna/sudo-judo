// Hilfsfunktionen für Reihenfolge-Aufgaben mit Regeln ("a vor b").
export interface Rule { a: string; b: string }

/** Erfüllt die Reihenfolge `ids` alle Regeln? Regeln mit unbekannten IDs werden ignoriert. */
export function satisfies(ids: string[], rules: Rule[]): boolean {
  const pos = new Map(ids.map((id, i) => [id, i]));
  return rules.every((r) => !pos.has(r.a) || !pos.has(r.b) || pos.get(r.a)! < pos.get(r.b)!);
}

/** Eine gültige Reihenfolge (topologisch sortiert, stabil) oder null bei Widerspruch. */
export function oneValidOrder(ids: string[], rules: Rule[]): string[] | null {
  const left = new Set(ids), out: string[] = [];
  while (left.size) {
    const next = ids.find((id) => left.has(id) && !rules.some((r) => r.b === id && left.has(r.a) && r.a !== id));
    if (next === undefined) return null;
    out.push(next); left.delete(next);
  }
  return out;
}

/** Anzahl gültiger Reihenfolgen (Teilmengen-DP, für bis zu 12 Elemente). */
export function countValidOrders(ids: string[], rules: Rule[]): number {
  const n = ids.length;
  if (n > 12) return -1;
  const idx = new Map(ids.map((id, i) => [id, i]));
  const pre = ids.map(() => 0);
  for (const r of rules) {
    const a = idx.get(r.a), b = idx.get(r.b);
    if (a !== undefined && b !== undefined) pre[b] |= 1 << a;
  }
  const ways = new Array(1 << n).fill(0);
  ways[0] = 1;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (!ways[mask]) continue;
    for (let i = 0; i < n; i++) if (!(mask & (1 << i)) && (pre[i] & mask) === pre[i]) ways[mask | (1 << i)] += ways[mask];
  }
  return ways[(1 << n) - 1];
}

/** Gleiche Mengen von Werten (Reihenfolge egal)? */
export const sameSet = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((x) => b.includes(x));
