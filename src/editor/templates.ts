import { SCHEMA_VERSION, uid, type Page, type Project } from '../shared/types.ts';
import { DEFAULT_TITLE, NEW_TITLE } from '../shared/brand.ts';

// Jede Vorlage erzeugt bei jedem Aufruf eine neue Seite mit frischen IDs.
type Make = (title: string) => Page;
const ids = (n: number) => Array.from({ length: n }, () => uid());
const world = (rows: number, cols: number, start: { x: number; y: number; dir: number }, goal?: [number, number]) => {
  const cells = new Array(rows * cols).fill(0);
  if (goal) cells[goal[1] * cols + goal[0]] = 2;
  return { rows, cols, cells, start };
};

const welcome: Make = (title) => ({
  id: uid(), title,
  blocks: [{ id: uid(), type: 'text',
    text: 'Hier lernst du mit kleinen Rätseln.\n\nKlicke unten auf „Weiter“, um die erste Aufgabe zu sehen.' }],
});

const mc: Make = (title) => ({
  id: uid(), title,
  blocks: [{
    id: uid(), type: 'mc', question: 'Welche Zahl steht im Binärcode 101?',
    options: [
      { id: uid(), text: '3', correct: false }, { id: uid(), text: '5', correct: true }, { id: uid(), text: '101', correct: false },
    ],
    hint: 'Von rechts nach links zählen die Stellen 1, 2, 4, 8 …',
  }],
});

const order: Make = (title) => ({
  id: uid(), title,
  blocks: [{
    id: uid(), type: 'order', question: 'Wie kocht man Tee? Bringe die Schritte in die richtige Reihenfolge.',
    items: [
      { id: uid(), text: 'Wasser erhitzen' }, { id: uid(), text: 'Teebeutel in die Tasse legen' },
      { id: uid(), text: 'Heißes Wasser eingießen' }, { id: uid(), text: 'Drei Minuten warten' },
    ],
    hint: 'Ohne heißes Wasser kann der Tee nicht ziehen.',
  }],
});

const sort: Make = (title) => {
  const [hw, sw] = ids(2);
  return {
    id: uid(), title,
    blocks: [{
      id: uid(), type: 'sort', question: 'Ist es Hardware oder Software?',
      categories: [{ id: hw, text: 'Hardware' }, { id: sw, text: 'Software' }],
      items: [
        { id: uid(), text: 'Maus', cat: hw }, { id: uid(), text: 'Webbrowser', cat: sw },
        { id: uid(), text: 'Bildschirm', cat: hw }, { id: uid(), text: 'Textprogramm', cat: sw },
      ],
      hint: 'Hardware kann man anfassen.',
    }],
  };
};

const grid: Make = (title) => ({
  id: uid(), title,
  blocks: [{
    id: uid(), type: 'grid', question: 'Male ein X: Färbe beide Diagonalen blau.',
    rows: 5, cols: 5, colors: 2, start: new Array(25).fill(0),
    target: Array.from({ length: 25 }, (_, i) => (Math.floor(i / 5) === i % 5 || Math.floor(i / 5) + (i % 5) === 4 ? 1 : 0)),
    hint: 'Die Diagonalen kreuzen sich in der Mitte.',
  }],
});

const graph: Make = (title) => {
  const [a, b, c, d, e] = ids(5);
  const pos = [[90, 180], [230, 80], [230, 280], [400, 80], [400, 280]];
  return {
    id: uid(), title,
    blocks: [{
      id: uid(), type: 'graph', mode: 'color', colors: 3, target: [],
      question: 'Färbe die Knoten so, dass verbundene Knoten verschiedene Farben haben.',
      nodes: [a, b, c, d, e].map((id, i) => ({ id, x: pos[i][0], y: pos[i][1], label: 'ABCDE'[i] })),
      edges: [[a, b], [a, c], [b, c], [b, d], [c, e], [d, e]].map(([x, y]) => ({ id: uid(), a: x, b: y })),
      hint: 'A, B und C sind alle miteinander verbunden – sie brauchen drei verschiedene Farben.',
    }],
  };
};

const robotBuild: Make = (title) => ({
  id: uid(), title,
  blocks: [{
    id: uid(), type: 'robot', mode: 'build',
    question: 'Bringe den Roboter zum Ziel – mit höchstens 2 Blöcken!',
    world: world(3, 7, { x: 0, y: 1, dir: 1 }, [6, 1]),
    allowed: ['move', 'left', 'right', 'repeat'], vars: [],
    starter: { main: [], defs: [] },
    solution: { main: [{ id: uid(), t: 'repeat', n: { v: '', n: 6 }, body: [{ id: uid(), t: 'move' }] }], defs: [] },
    maxBlocks: 2, predict: 'position', predictVar: 'x', showPython: true,
    hint: 'Ein Block wiederholt einen anderen Block mehrmals.',
  }],
});

const robotPredict: Make = (title) => ({
  id: uid(), title,
  blocks: [{
    id: uid(), type: 'robot', mode: 'predict',
    question: 'Wo steht der Roboter, wenn das Programm fertig ist?',
    world: world(5, 5, { x: 0, y: 4, dir: 0 }),
    allowed: [], vars: [], maxBlocks: 0, predict: 'position', predictVar: 'x', showPython: true,
    hint: 'Gehe das Programm Schritt für Schritt durch.',
    starter: { main: [{ id: uid(), t: 'repeat', n: { v: '', n: 2 }, body: [
      { id: uid(), t: 'move' }, { id: uid(), t: 'move' }, { id: uid(), t: 'right' }] }], defs: [] },
    solution: { main: [], defs: [] },
  }],
});


// ---- Vorlagen für Bilder, Regeln, Folgen, Plätze, Felder, gerichtete Graphen ----
const svg = (w: number, h: number, body: string) =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`);
const shape = (kind: 'circle' | 'square' | 'triangle') => svg(120, 120,
  kind === 'circle' ? '<circle cx="60" cy="60" r="48" fill="#0a6c8c"/>'
  : kind === 'square' ? '<rect x="14" y="14" width="92" height="92" fill="#e0a100"/>'
  : '<polygon points="60,10 112,108 8,108" fill="#a93b26"/>');

const mcImages: Make = (title) => ({
  id: uid(), title,
  blocks: [{
    id: uid(), type: 'mc', question: 'Welches Bild zeigt ein Dreieck?',
    options: [
      { id: uid(), text: 'Bild A', img: shape('circle'), correct: false },
      { id: uid(), text: 'Bild B', img: shape('square'), correct: false },
      { id: uid(), text: 'Bild C', img: shape('triangle'), correct: true },
    ],
    hint: 'Ein Dreieck hat drei Ecken.',
  }],
});

const orderRules: Make = (title) => {
  const [u, h, so, sc, j] = ids(5);
  return {
    id: uid(), title,
    blocks: [{
      id: uid(), type: 'order', mode: 'rules',
      question: 'Zieh dich an! Bringe die Kleidungsstücke in eine sinnvolle Reihenfolge.',
      items: [
        { id: u, text: 'Unterhose' }, { id: h, text: 'Hose' }, { id: so, text: 'Socken' },
        { id: sc, text: 'Schuhe' }, { id: j, text: 'Jacke' },
      ],
      rules: [{ a: u, b: h }, { a: h, b: sc }, { a: so, b: sc }, { a: h, b: j }],
      hint: 'Was muss zuerst angezogen sein, damit das Nächste passt? Es gibt mehrere richtige Wege.',
    }],
  };
};

const seq: Make = (title) => {
  const [p2, p3] = ids(2);
  return {
    id: uid(), title,
    blocks: [{
      id: uid(), type: 'seq', question: 'Baue eine Folge aus +2 und +3, deren Summe genau 6 ist.',
      tokens: [{ id: p2, text: '+2' }, { id: p3, text: '+3' }],
      answers: [[p3, p3], [p2, p2, p2]], maxLen: 5,
      hint: 'Es gibt zwei verschiedene Lösungen.',
    }],
  };
};

const slotsText: Make = (title) => {
  const [ein, aus] = ids(2);
  return {
    id: uid(), title,
    blocks: [{
      id: uid(), type: 'slots', layout: 'text', input: 'dropdown',
      question: 'Ergänze den Satz.',
      text: 'Die Maus ist ein ___gerät, der Bildschirm ist ein ___gerät.', bg: '', bgAlt: '',
      tokens: [{ id: ein, text: 'Eingabe', count: 0 }, { id: aus, text: 'Ausgabe', count: 0 }],
      slots: [
        { id: uid(), label: 'Maus', x: 50, y: 50, accept: [ein] },
        { id: uid(), label: 'Bildschirm', x: 50, y: 50, accept: [aus] },
      ],
      hint: 'Mit der Maus gibst du etwas in den Computer ein.',
    }],
  };
};

const computerSvg = svg(600, 360,
  '<rect width="600" height="360" fill="#f3f6f8"/>'
  + '<rect x="150" y="20" width="300" height="190" rx="14" fill="#fff" stroke="#1c2b33" stroke-width="6"/>'
  + '<rect x="172" y="40" width="256" height="150" fill="#d6e6ee"/>'
  + '<rect x="270" y="210" width="60" height="28" fill="#1c2b33"/><rect x="215" y="238" width="170" height="12" rx="6" fill="#1c2b33"/>'
  + '<rect x="110" y="268" width="330" height="70" rx="10" fill="#fff" stroke="#1c2b33" stroke-width="6"/>'
  + '<ellipse cx="520" cy="300" rx="30" ry="42" fill="#fff" stroke="#1c2b33" stroke-width="6"/><line x1="520" y1="258" x2="520" y2="290" stroke="#1c2b33" stroke-width="5"/>');

const slotsImage: Make = (title) => {
  const [bs, tk, ms] = ids(3);
  return {
    id: uid(), title,
    blocks: [{
      id: uid(), type: 'slots', layout: 'image', input: 'drag',
      question: 'Beschrifte den Computer: Ziehe jede Karte auf das passende Teil.',
      text: '', bg: computerSvg, bgAlt: 'Zeichnung eines Computers mit Bildschirm, Tastatur und Maus.',
      tokens: [{ id: bs, text: 'Bildschirm' }, { id: tk, text: 'Tastatur' }, { id: ms, text: 'Maus' }],
      slots: [
        { id: uid(), label: 'oben: großes Gerät mit Anzeige', x: 50, y: 32, accept: [bs] },
        { id: uid(), label: 'unten: breites Gerät mit Tasten', x: 46, y: 84, accept: [tk] },
        { id: uid(), label: 'rechts: kleines ovales Gerät', x: 87, y: 83, accept: [ms] },
      ],
      hint: 'Mit der Tastatur schreibst du, mit der Maus zeigst du.',
    }],
  };
};

const cells: Make = (title) => ({
  id: uid(), title,
  blocks: [{
    id: uid(), type: 'cells', question: 'Welche Felder liegen auf dem kürzesten Weg vom Start (▶) zum Ziel (★)? Rote Linien sind Wände.',
    rows: 3, cols: 3, bg: '', bgAlt: '', aspect: 1,
    walls: ['0,0,r', '0,1,r'], start: { x: 0, y: 0 }, goal: { x: 2, y: 2 },
    answers: [[0, 3, 6, 7, 8]], hint: 'Die Wände zwingen dich zuerst nach unten.',
  }],
});

const graphDirected: Make = (title) => {
  const [a, b, c, d] = ids(4);
  const e = ids(5);
  return {
    id: uid(), title,
    blocks: [{
      id: uid(), type: 'graph', mode: 'edges', colors: 3, directed: true, alts: [],
      question: 'Welcher Weg von A nach D ist am kürzesten? Markiere die Straßen. Die Zahlen sind Kilometer.',
      nodes: [{ id: a, x: 80, y: 180, label: 'A' }, { id: b, x: 240, y: 80, label: 'B' }, { id: c, x: 300, y: 280, label: 'C' }, { id: d, x: 500, y: 180, label: 'D' }],
      edges: [
        { id: e[0], a, b, w: '2' }, { id: e[1], a, b: c, w: '5' }, { id: e[2], a: b, b: c, w: '1' },
        { id: e[3], a: b, b: d, w: '7' }, { id: e[4], a: c, b: d, w: '2' },
      ],
      target: [e[0], e[2], e[4]],
      hint: 'Addiere die Kilometer jedes möglichen Wegs.',
    }],
  };
};

export interface Template { id: string; name: string; description: string; make: Make }

/** Vorlagen-Galerie für „+ Seite“. */
export const templates: Template[] = [
  { id: 'mc', name: 'Auswahlaufgabe', description: 'Eine Frage, mehrere Antworten – eine oder mehrere sind richtig.', make: mc },
  { id: 'order', name: 'Reihenfolge', description: 'Karten in die richtige Reihenfolge bringen (z. B. ein Algorithmus).', make: order },
  { id: 'sort', name: 'Zuordnen', description: 'Karten in Gruppen sortieren.', make: sort },
  { id: 'grid', name: 'Pixelbild', description: 'Ein Gitter so färben, dass ein Muster entsteht.', make: grid },
  { id: 'graph', name: 'Graph färben', description: 'Knoten so färben, dass Nachbarn verschiedene Farben haben.', make: graph },
  { id: 'mc-images', name: 'Bild-Auswahl', description: 'Wie Auswahlaufgabe, aber die Antworten sind Bilder.', make: mcImages },
  { id: 'order-rules', name: 'Reihenfolge mit Regeln', description: 'Mehrere Reihenfolgen sind richtig („A vor B“).', make: orderRules },
  { id: 'seq', name: 'Folge bauen', description: 'Aus Bausteinen eine Folge bilden; mehrere Lösungen möglich.', make: seq },
  { id: 'slots-text', name: 'Lückentext', description: 'Lücken im Satz mit einer Auswahlliste füllen.', make: slotsText },
  { id: 'slots-image', name: 'Bild beschriften', description: 'Karten auf die richtigen Stellen eines Bildes ziehen.', make: slotsImage },
  { id: 'cells', name: 'Felder wählen', description: 'Felder auf einem Raster mit Wänden anklicken (z. B. kürzester Weg).', make: cells },
  { id: 'graph-directed', name: 'Gerichteter Graph', description: 'Straßen mit Pfeilen und Entfernungen: kürzesten Weg markieren.', make: graphDirected },
  { id: 'robot-build', name: 'Roboter programmieren', description: 'Mit Blöcken (und Python-Ansicht) ein Programm bauen.', make: robotBuild },
  { id: 'robot-predict', name: 'Programm vorhersagen', description: 'Ein Programm lesen und das Ergebnis bestimmen.', make: robotPredict },
];

export function sampleProject(): Project {
  return {
    schemaVersion: SCHEMA_VERSION, id: uid() + uid(), title: DEFAULT_TITLE,
    pages: [
      welcome('Willkommen'), mc('Erste Aufgabe'), order('Zweite Aufgabe'), sort('Dritte Aufgabe'),
      grid('Vierte Aufgabe'), graph('Fünfte Aufgabe'), robotBuild('Sechste Aufgabe'), robotPredict('Siebte Aufgabe'),
    ],
  };
}

export function blankProject(): Project {
  return {
    schemaVersion: SCHEMA_VERSION, id: uid() + uid(), title: NEW_TITLE,
    pages: [{ id: uid(), title: 'Start', blocks: [{ id: uid(), type: 'text', text: 'Willkommen! Hier warten ein paar Rätsel auf dich.' }] }],
  };
}
