export const SCHEMA_VERSION = 1;

export interface TextBlock { id: string; type: 'text'; text: string }
export interface McOption { id: string; text: string; correct: boolean; img?: string }
export interface McBlock {
  id: string; type: 'mc';
  question: string; options: McOption[]; hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}
export interface OrderBlock {
  id: string; type: 'order';
  question: string;
  items: { id: string; text: string; img?: string }[]; // 'fixed': in der RICHTIGEN Reihenfolge; Schüler sehen sie gemischt
  mode?: 'fixed' | 'rules';                           // 'rules': richtig ist jede Reihenfolge, die alle Regeln erfüllt
  rules?: { a: string; b: string }[];                 // "a muss vor b stehen" (Element-IDs)
  hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}
export interface ImageBlock { id: string; type: 'image'; src: string; alt: string }
export interface SortBlock {
  id: string; type: 'sort';
  question: string;
  categories: { id: string; text: string }[];
  items: { id: string; text: string; cat: string; img?: string }[]; // cat = richtige Kategorie
  hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}
export interface GridBlock {
  id: string; type: 'grid';
  question: string;
  rows: number; cols: number;
  colors: number;      // 2–4 Farben (siehe palette.ts); Klick wechselt zur nächsten Farbe
  start: number[];     // Ausgangsbild, zeilenweise
  target: number[];    // Lösung, zeilenweise
  alts?: number[][];   // weitere richtige Lösungen
  hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}
export interface GraphNode { id: string; x: number; y: number; label: string; shape?: 'circle' | 'square' | 'diamond'; color?: number }
export interface GraphEdge { id: string; a: string; b: string; w?: string }  // w = Beschriftung/Gewicht
export interface GraphBlock {
  id: string; type: 'graph';
  question: string;
  mode: 'nodes' | 'edges' | 'color'; // Knoten markieren / Kanten markieren / Knoten färben
  nodes: GraphNode[];                // Zeichenfläche 600 × 360
  edges: GraphEdge[];
  target: string[];                  // Lösung (Knoten- oder Kanten-IDs); im Modus "color" leer
  colors: number;                    // erlaubte Farben im Modus "color" (2–4)
  directed?: boolean;                // Kanten mit Pfeil von a nach b
  alts?: string[][];                 // weitere richtige Lösungen (Modi "nodes"/"edges")
  hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}

// ---- Folgen, Lücken/Plätze und Felder ----
export interface Token { id: string; text: string; img?: string; count?: number } // count: Anzahl verfügbarer Exemplare (Standard 1, 0 = unbegrenzt)
export interface SeqBlock {
  id: string; type: 'seq';
  question: string;
  tokens: Token[];            // Bausteine (beliebig oft verwendbar)
  answers: string[][];        // alle richtigen Folgen (Token-IDs)
  maxLen: number;
  hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}
export interface Slot { id: string; label: string; x: number; y: number; accept: string[] } // x,y in % (Layout "image")
export interface SlotsBlock {
  id: string; type: 'slots';
  question: string;
  layout: 'list' | 'text' | 'image';  // Plätze als Liste | Lückentext mit ___ | auf einem Bild
  input: 'drag' | 'dropdown';
  text: string;                       // Layout "text": Text mit ___ als Lücken (in Reihenfolge der Plätze)
  bg: string; bgAlt: string;          // Layout "image"
  tokens: Token[];
  slots: Slot[];
  hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}
export interface CellsBlock {
  id: string; type: 'cells';
  question: string;
  rows: number; cols: number;
  bg: string; bgAlt: string; aspect: number; // optionales Hintergrundbild; aspect = Breite/Höhe des Spielfelds
  walls: string[];                    // "x,y,r" = Wand rechts von Feld (x,y); "x,y,b" = Wand darunter
  start: { x: number; y: number } | null;
  goal: { x: number; y: number } | null;
  answers: number[][];                // alle richtigen Feldauswahlen (Feldnummern zeilenweise)
  hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}
// ---- Roboter / Programmieren (Blöcke ↔ Python teilen sich dieselbe Programmstruktur) ----
export interface Val { v: string; n: number }                 // v = Variablenname, '' = feste Zahl n
export interface Cond {
  kind: 'wallAhead' | 'wallLeft' | 'wallRight' | 'onGoal' | 'cmp';
  not: boolean;
  v: string; op: '<' | '>' | '==' | '!='; val: Val;            // nur für kind 'cmp': v op val
}
export type Stmt = { id: string } & (
  | { t: 'move' } | { t: 'left' } | { t: 'right' }
  | { t: 'repeat'; n: Val; body: Stmt[] }
  | { t: 'if'; c: Cond; then: Stmt[] }
  | { t: 'ifelse'; c: Cond; then: Stmt[]; else: Stmt[] }
  | { t: 'while'; c: Cond; body: Stmt[] }
  | { t: 'set'; v: string; val: Val }
  | { t: 'change'; v: string; val: Val }
  | { t: 'call'; f: string }
);
export type StmtType = Stmt['t'];
export interface Def { id: string; name: string; body: Stmt[] }
export interface Program { main: Stmt[]; defs: Def[] }
export interface World {
  rows: number; cols: number;
  cells: number[];                                  // 0 frei, 1 Wand, 2 Ziel (zeilenweise)
  start: { x: number; y: number; dir: number };     // dir: 0 Norden, 1 Osten, 2 Süden, 3 Westen
}
export interface RobotBlock {
  id: string; type: 'robot';
  question: string;
  mode: 'build' | 'predict';       // Programm bauen/reparieren | Ergebnis vorhersagen
  world: World;
  allowed: StmtType[];             // Blöcke in der Palette
  vars: string[];                  // erlaubte Variablennamen
  starter: Program;                // Startprogramm der Schüler (build) bzw. gezeigtes Programm (predict)
  solution: Program;               // Musterlösung (nur build; dient der Kontrolle im Editor)
  maxBlocks: number;               // 0 = unbegrenzt
  predict: 'position' | 'variable';
  predictVar: string;
  showPython: boolean;
  hint: string;
  level?: number;     // Schwierigkeit als Gürtelstufe: 0 (weiß) … 6 (schwarz); leer = nicht angegeben
}
export type Block = TextBlock | McBlock | OrderBlock | ImageBlock | SortBlock | GridBlock | GraphBlock | SeqBlock | SlotsBlock | CellsBlock | RobotBlock;

export interface Page { id: string; title: string; blocks: Block[] }
export interface Project {
  schemaVersion: number;
  id: string;        // Schlüssel für den Lernfortschritt im Browser
  title: string;
  theme?: 'klar' | 'bunt';   // Aussehen der fertigen Seite
  progress?: 'off' | 'plain' | 'belts'; // Fortschritt für die Schüler: keiner | Balken | Gürtel
  levels?: boolean;          // Schwierigkeitsstufen (Gürtelfarben) an Aufgaben verwenden
  pages: Page[];
}

export const uid = () => Math.random().toString(36).slice(2, 10);
