// Lernfortschritt im Browser. Fällt still auf "nichts gespeichert" zurück,
// wenn localStorage blockiert ist (z. B. in manchen Schulbrowsern).
// Der Schlüssel behält den alten Präfix, damit vorhandener Lernfortschritt nach der Umbenennung erhalten bleibt.
const key = (projectId: string) => `raetselbox:progress:${projectId}`;

export function loadSolved(projectId: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(projectId)) ?? '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch { return []; }
}

export function saveSolved(projectId: string, ids: string[]) {
  try { localStorage.setItem(key(projectId), JSON.stringify(ids)); } catch { /* ignorieren */ }
}
