import { uid } from '../shared/types.ts';

/** Tiefe Kopie mit neuen IDs. Verweise (Kanten, Lösungen, Kategorien, Aufrufe) werden mit umgestellt. */
export function cloneWithNewIds<T>(x: T): T {
  let json = JSON.stringify(x);
  const ids = new Set([...json.matchAll(/"id":"([^"]+)"/g)].map((m) => m[1]));
  for (const old of ids) {
    const fresh = uid();
    json = json.split(`"${old}"`).join(`"${fresh}"`);
  }
  return JSON.parse(json);
}
