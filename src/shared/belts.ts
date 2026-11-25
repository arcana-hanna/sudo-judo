// Gürtel (Judo): sieben Stufen von Weiß bis Schwarz. Dienen als Schwierigkeitsstufe einer Aufgabe
// und als Fortschrittsanzeige für die Schüler.
export interface Belt { name: string; nom: string; gen: string; color: string }

export const BELTS: Belt[] = [
  { name: 'Weiß',    nom: 'Weißer',    gen: 'weißen',    color: '#f2efe6' },
  { name: 'Gelb',    nom: 'Gelber',    gen: 'gelben',    color: '#f2c230' },
  { name: 'Orange',  nom: 'Oranger',   gen: 'orangen',   color: '#ee8a2a' },
  { name: 'Grün',    nom: 'Grüner',    gen: 'grünen',    color: '#3f9a4a' },
  { name: 'Blau',    nom: 'Blauer',    gen: 'blauen',    color: '#2f6fc0' },
  { name: 'Braun',   nom: 'Brauner',   gen: 'braunen',   color: '#7b4a2a' },
  { name: 'Schwarz', nom: 'Schwarzer', gen: 'schwarzen', color: '#1b1b1b' },
];
export const MAX_BELT = BELTS.length - 1;

/** Gürtel nach Fortschritt: Schwarz erst, wenn alles gelöst ist. */
export const beltFor = (done: number, total: number) => (total <= 0 ? 0 : Math.min(MAX_BELT, Math.floor((done * MAX_BELT) / total)));

/** Wie viele Aufgaben müssen insgesamt gelöst sein, damit `belt` erreicht ist? */
export const neededFor = (belt: number, total: number) => Math.ceil((belt * total) / MAX_BELT);

/** Nächster Gürtel und wie viele Aufgaben noch fehlen (null, wenn schon Schwarz). */
export function nextBelt(done: number, total: number): { belt: number; missing: number } | null {
  const r = beltFor(done, total);
  if (r >= MAX_BELT) return null;
  return { belt: r + 1, missing: Math.max(1, neededFor(r + 1, total) - done) };
}

const clampBelt = (n: number) => Math.min(MAX_BELT, Math.max(0, Math.round(n) || 0));
export const beltName = (n: number) => BELTS[clampBelt(n)].name;
export const beltAdj = (n: number) => BELTS[clampBelt(n)].nom;
