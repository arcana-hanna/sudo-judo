// Lernfortschritt im Browser. Fällt still auf "nichts gespeichert" zurück,
// wenn localStorage blockiert ist (z. B. in manchen Schulbrowsern).
import { readStored, writeStored } from './storage';

const suffix = (projectId: string) => `progress:${projectId}`;

export function loadSolved(projectId: string): string[] {
  try {
    const v = JSON.parse(readStored(suffix(projectId)) ?? '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch { return []; }
}

export function saveSolved(projectId: string, ids: string[]) {
  writeStored(suffix(projectId), JSON.stringify(ids));
}
