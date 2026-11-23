import type { Block, Project } from './types.ts';
import { solveColoring } from './graph.ts';
import { simulate } from './robot/sim.ts';
import { countBlocks } from './robot/tree.ts';
import { countValidOrders } from './order.ts';

export interface Issue { pageId: string; blockId: string | null; where: string; message: string }

export const BLOCK_LABELS: Record<string, string> = {
  text: 'Text', image: 'Bild', mc: 'Auswahlaufgabe', order: 'Reihenfolge-Aufgabe',
  sort: 'Zuordnungsaufgabe', grid: 'Gitter-Aufgabe', graph: 'Graph-Aufgabe', robot: 'Programmier-Aufgabe',
  seq: 'Folgen-Aufgabe', slots: 'Platz-Aufgabe', cells: 'Felder-Aufgabe',
};

/** Findet unfertige Stellen, bevor das Projekt exportiert wird. */
export function validate(p: Project): Issue[] {
  const out: Issue[] = [];
  const add = (pageId: string, blockId: string | null, where: string, message: string) =>
    out.push({ pageId, blockId, where, message });
  const blank = (s: string | undefined) => !s || !s.trim();

  if (p.pages.length === 0) add('', null, 'Projekt', 'Das Projekt hat noch keine Seiten.');
  const size = JSON.stringify(p).length;
  if (size > 8_000_000) add('', null, 'Projekt', `Das Projekt ist sehr groß (${(size / 1e6).toFixed(1)} MB) – die Seite lädt langsam. Verkleinere oder entferne Bilder.`);

  for (const page of p.pages) {
    const pg = page.title.trim() || 'Seite ohne Titel';
    if (blank(page.title)) add(page.id, null, pg, 'Die Seite hat keinen Titel.');
    if (page.blocks.length === 0) add(page.id, null, pg, 'Die Seite ist leer.');
    for (const b of page.blocks) {
      const w = `${pg} · ${BLOCK_LABELS[b.type] ?? b.type}`;
      const bad = (msg: string) => add(page.id, b.id, w, msg);
      blockIssues(b, bad, blank);
    }
  }
  return out;
}

function blockIssues(b: Block, bad: (m: string) => void, blank: (s?: string) => boolean) {
  if (b.type !== 'text' && b.type !== 'image' && blank((b as { question: string }).question)) bad('Die Aufgabenstellung fehlt.');
  switch (b.type) {
    case 'text': if (blank(b.text)) bad('Der Text ist leer.'); break;
    case 'image':
      if (!b.src) bad('Es ist noch kein Bild ausgewählt.');
      else if (blank(b.alt)) bad('Die Bildbeschreibung fehlt (wichtig für Screenreader).');
      break;
    case 'mc':
      if (b.options.length < 2) bad('Es braucht mindestens zwei Antworten.');
      if (b.options.some((o) => blank(o.text) && !o.img)) bad('Mindestens eine Antwort ist leer.');
      if (b.options.some((o) => o.img && blank(o.text))) bad('Bei Bild-Antworten fehlt ein kurzer Text (für Screenreader), z. B. „Bild A“.');
      if (!b.options.some((o) => o.correct)) bad('Es ist keine richtige Antwort markiert.');
      break;
    case 'order':
      if (b.items.length < 2) bad('Es braucht mindestens zwei Elemente.');
      if (b.items.some((i) => blank(i.text) && !i.img)) bad('Mindestens ein Element ist leer.');
      if (b.items.some((i) => i.img && blank(i.text))) bad('Bei Bild-Elementen fehlt ein kurzer Text (für Screenreader).');
      if (b.mode === 'rules') {
        const n = countValidOrders(b.items.map((i) => i.id), b.rules ?? []);
        if (n === 0) bad('Die Regeln widersprechen sich – keine Reihenfolge erfüllt sie.');
        else if (n > 1 && (b.rules ?? []).length === 0) bad('Es gibt keine Regeln – jede Reihenfolge wäre richtig.');
      }
      break;
    case 'sort':
      if (b.categories.some((c) => blank(c.text))) bad('Mindestens eine Gruppe hat keinen Namen.');
      if (b.items.length < 2) bad('Es braucht mindestens zwei Karten.');
      if (b.items.some((i) => blank(i.text) && !i.img)) bad('Mindestens eine Karte ist leer.');
      if (b.items.some((i) => i.img && blank(i.text))) bad('Bei Bild-Karten fehlt ein kurzer Text (für Screenreader).');
      break;
    case 'grid':
      if ((b.alts ?? []).some((a) => a.length === b.start.length && a.every((v, i) => v === b.start[i]))) bad('Eine weitere Lösung ist gleich dem Startbild.');
      if (b.start.length === b.target.length && b.start.every((v, i) => v === b.target[i]))
        bad('Startbild und Lösung sind gleich – die Aufgabe ist sofort gelöst.');
      break;
    case 'graph':
      if (b.nodes.length < 2) bad('Der Graph braucht mindestens zwei Knoten.');
      if (b.mode === 'edges' && b.edges.length === 0) bad('Der Graph hat keine Kanten.');
      if (b.mode !== 'color' && b.target.length === 0) bad('Die richtige Lösung ist nicht markiert.');
      if (b.mode !== 'color' && (b.alts ?? []).some((a) => a.length === 0)) bad('Eine weitere Lösung ist leer.');
      if (b.mode === 'color' && b.nodes.length > 0 && solveColoring(b.nodes, b.edges, b.colors) === null)
        bad(`Der Graph lässt sich mit ${b.colors} Farben nicht färben.`);
      break;
    case 'seq':
      if (b.tokens.length < 2) bad('Es braucht mindestens zwei Bausteine.');
      if (b.tokens.some((t) => blank(t.text) && !t.img)) bad('Mindestens ein Baustein ist leer.');
      if (b.answers.length === 0 || b.answers.every((a) => a.length === 0)) bad('Es ist keine richtige Folge eingetragen.');
      else if (b.answers.some((a) => a.length === 0)) bad('Eine richtige Folge ist leer.');
      if (b.answers.some((a) => a.length > b.maxLen)) bad('Eine richtige Folge ist länger als die erlaubte Länge.');
      break;
    case 'slots': {
      if (b.slots.length === 0) bad('Es gibt noch keine Plätze.');
      if (b.tokens.length < 1) bad('Es gibt noch keine Karten zum Einsetzen.');
      if (b.tokens.some((t) => blank(t.text) && !t.img)) bad('Mindestens eine Karte ist leer.');
      if (b.slots.some((s) => s.accept.length === 0)) bad('Bei mindestens einem Platz ist keine richtige Karte gewählt.');
      if (b.layout === 'image' && !b.bg) bad('Es ist kein Hintergrundbild ausgewählt.');
      if (b.layout === 'image' && b.bg && blank(b.bgAlt)) bad('Die Beschreibung des Hintergrundbilds fehlt (für Screenreader).');
      if (b.layout === 'text' && (b.text.match(/___/g) ?? []).length !== b.slots.length) bad('Die Zahl der Lücken (___) im Text passt nicht zur Zahl der Plätze.');
      // Genug Karten für alle Plätze?
      const cap = (t: { count?: number }) => (t.count === 0 ? Infinity : t.count ?? 1);
      const need = new Map<string, number>();
      for (const s of b.slots) if (s.accept.length === 1) need.set(s.accept[0], (need.get(s.accept[0]) ?? 0) + 1);
      for (const [id, n] of need) { const t = b.tokens.find((t) => t.id === id); if (t && cap(t) < n) bad('Von einer Karte werden mehr Exemplare gebraucht, als verfügbar sind.'); }
      break;
    }
    case 'cells':
      if (b.rows < 1 || b.cols < 1) bad('Das Spielfeld ist leer.');
      if (b.answers.length === 0 || b.answers.every((a) => a.length === 0)) bad('Es sind keine richtigen Felder markiert.');
      else if (b.answers.some((a) => a.length === 0)) bad('Eine richtige Lösung ist leer.');
      if (b.bg && blank(b.bgAlt)) bad('Die Beschreibung des Hintergrundbilds fehlt (für Screenreader).');
      break;
    case 'robot': {
      const empty = (pr: { main: unknown[]; defs: unknown[] }) => pr.main.length + pr.defs.length === 0;
      if (b.mode === 'build') {
        if (!b.world.cells.includes(2)) bad('Das Spielfeld hat kein Ziel.');
        else if (empty(b.solution)) bad('Es gibt keine Musterlösung – die Lösbarkeit ist ungeprüft.');
        else {
          const r = simulate(b.solution, b.world, b.vars);
          if (r.status !== 'ok' || b.world.cells[r.final.y * b.world.cols + r.final.x] !== 2) bad('Die Musterlösung erreicht das Ziel nicht.');
          else if (b.maxBlocks > 0 && countBlocks(b.solution) > b.maxBlocks) bad('Die Musterlösung braucht mehr Blöcke als erlaubt.');
        }
      } else {
        if (empty(b.starter)) bad('Es gibt kein Programm, das die Schüler lesen können.');
        else if (simulate(b.starter, b.world, b.vars).status !== 'ok') bad('Das Programm stößt an eine Wand oder läuft endlos.');
        if (b.predict === 'variable' && !b.vars.includes(b.predictVar)) bad('Die gefragte Variable existiert nicht.');
      }
      break;
    }
  }
}
