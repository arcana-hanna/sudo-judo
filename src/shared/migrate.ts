import { SCHEMA_VERSION, type Project } from './types.ts';
import { DEFAULT_TITLE } from './brand.ts';
import { normalizeTheme, PROGRESS_MODES } from './themes.ts';

// Ältere Dateien kannten die Optionen noch nicht: Gürtel/Stufen werden übernommen, wenn sie bereits benutzt wurden.
const hasLevel = (pages: any[]) => Array.isArray(pages) && pages.some((p) => Array.isArray(p?.blocks) && p.blocks.some((b: any) => typeof b?.level === 'number'));

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
    theme: normalizeTheme(raw.theme),
    progress: PROGRESS_MODES.includes(raw.progress) ? raw.progress : raw.theme === 'dojo' ? 'belts' : 'plain',
    levels: typeof raw.levels === 'boolean' ? raw.levels : raw.theme === 'dojo' || hasLevel(raw.pages),
    pages: raw.pages.map((p: any) => ({
      id: String(p.id), title: String(p.title ?? ''),
      blocks: Array.isArray(p.blocks) ? p.blocks : [],
    })),
  };
}
