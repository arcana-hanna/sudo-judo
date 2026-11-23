import { SCHEMA_VERSION, type Project } from './types';
import { DEFAULT_TITLE } from './brand';

/** Prüft ein geladenes Projekt und hebt ältere Versionen auf die aktuelle an. */
export function migrate(raw: any): Project {
  if (!raw || typeof raw !== 'object') throw new Error('Ungültiges Projekt.');
  // Künftig: if (raw.schemaVersion === 1) raw = v1to2(raw); ...
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unbekannte Projektversion: ${raw.schemaVersion}`);
  }
  if (!Array.isArray(raw.pages)) throw new Error('Projekt enthält keine Seiten.');
  return {
    schemaVersion: SCHEMA_VERSION,
    id: String(raw.id ?? ''),
    title: String(raw.title ?? DEFAULT_TITLE),
    pages: raw.pages.map((p: any) => ({
      id: String(p.id), title: String(p.title ?? ''),
      blocks: Array.isArray(p.blocks) ? p.blocks : [],
    })),
  };
}
