import type { Component } from 'svelte';
import { uid, type Block } from '../shared/types';
import TextCanvas from './canvas/TextCanvas.svelte';
import McCanvas from './canvas/McCanvas.svelte';
import OrderCanvas from './canvas/OrderCanvas.svelte';
import SortCanvas from './canvas/SortCanvas.svelte';
import ImageCanvas from './canvas/ImageCanvas.svelte';
import GridCanvas from './canvas/GridCanvas.svelte';
import GraphCanvas from './canvas/GraphCanvas.svelte';
import RobotCanvas from './canvas/RobotCanvas.svelte';
import SeqCanvas from './canvas/SeqCanvas.svelte';
import SlotsCanvas from './canvas/SlotsCanvas.svelte';
import CellsCanvas from './canvas/CellsCanvas.svelte';

export interface EditorBlockDef {
  label: string;               // Name in Lehrersprache
  desc: string;                // eine Zeile für die Auswahl
  component: Component<any>;
  formLike: boolean;           // true = (noch) klassisches Formular, false = Bearbeiten direkt im Schülerlayout
  create: () => Block;
}

/** Reihenfolge und Gruppen der Block-Auswahl. */
export const groups: { name: string; types: string[] }[] = [
  { name: 'Erklären', types: ['text', 'image'] },
  { name: 'Auswählen', types: ['mc'] },
  { name: 'Ordnen', types: ['order', 'seq'] },
  { name: 'Zuordnen und beschriften', types: ['sort', 'slots'] },
  { name: 'Zeichnen und markieren', types: ['grid', 'graph', 'cells'] },
  { name: 'Programmieren', types: ['robot'] },
];

export const editorBlocks: Record<string, EditorBlockDef> = {
  text: { label: 'Text', desc: 'Erklärung oder Aufgabentext', component: TextCanvas, formLike: false, create: () => ({ id: uid(), type: 'text', text: '' }) },
  mc: {
    label: 'Auswahlaufgabe', desc: 'Eine Frage mit mehreren Antworten', component: McCanvas, formLike: false,
    create: () => ({
      id: uid(), type: 'mc', question: '', hint: '',
      options: [
        { id: uid(), text: '', correct: true },
        { id: uid(), text: '', correct: false },
      ],
    }),
  },
  order: {
    label: 'Reihenfolge', desc: 'Karten in die richtige Reihenfolge bringen', component: OrderCanvas, formLike: false,
    create: () => ({
      id: uid(), type: 'order', question: '', hint: '',
      items: [{ id: uid(), text: '' }, { id: uid(), text: '' }, { id: uid(), text: '' }],
    }),
  },
  image: { label: 'Bild', desc: 'Foto oder Zeichnung zeigen', component: ImageCanvas, formLike: false, create: () => ({ id: uid(), type: 'image', src: '', alt: '' }) },
  sort: {
    label: 'Zuordnen', desc: 'Karten in Gruppen sortieren', component: SortCanvas, formLike: false,
    create: () => {
      const a = uid(), b = uid();
      return {
        id: uid(), type: 'sort', question: '', hint: '',
        categories: [{ id: a, text: '' }, { id: b, text: '' }],
        items: [{ id: uid(), text: '', cat: a }, { id: uid(), text: '', cat: b }],
      };
    },
  },
  grid: {
    label: 'Pixelbild', desc: 'Ein Raster nach Vorlage färben', component: GridCanvas, formLike: false,
    create: () => ({
      id: uid(), type: 'grid', question: '', hint: '', rows: 4, cols: 4, colors: 2,
      start: new Array(16).fill(0), target: new Array(16).fill(0),
    }),
  },
  graph: {
    label: 'Graph', desc: 'Knoten und Kanten markieren oder färben', component: GraphCanvas, formLike: false,
    create: () => ({
      id: uid(), type: 'graph', question: '', hint: '', mode: 'nodes', colors: 3, target: [],
      nodes: [], edges: [],
    }),
  },
  robot: {
    label: 'Roboter programmieren', desc: 'Mit Blöcken (und Python-Ansicht) programmieren', component: RobotCanvas, formLike: false,
    create: () => ({
      id: uid(), type: 'robot', question: '', mode: 'build', hint: '', showPython: true,
      world: { rows: 5, cols: 6, cells: new Array(30).fill(0).map((_, i) => (i === 2 * 6 + 5 ? 2 : 0)), start: { x: 0, y: 2, dir: 1 } },
      allowed: ['move', 'left', 'right', 'repeat'], vars: ['x'],
      starter: { main: [], defs: [] }, solution: { main: [], defs: [] },
      maxBlocks: 0, predict: 'position', predictVar: 'x',
    }),
  },
  seq: {
    label: 'Folge bauen', desc: 'Aus Bausteinen eine Folge zusammenstellen', component: SeqCanvas, formLike: false,
    create: () => {
      const a = uid(), b = uid();
      return { id: uid(), type: 'seq', question: '', hint: '', maxLen: 6, tokens: [{ id: a, text: '' }, { id: b, text: '' }], answers: [[]] };
    },
  },
  slots: {
    label: 'Lücken und Beschriften', desc: 'Karten in Lücken oder auf ein Bild setzen', component: SlotsCanvas, formLike: false,
    create: () => ({
      id: uid(), type: 'slots', question: '', hint: '', layout: 'list', input: 'drag', text: '', bg: '', bgAlt: '',
      tokens: [{ id: uid(), text: '' }, { id: uid(), text: '' }], slots: [],
    }),
  },
  cells: {
    label: 'Felder wählen', desc: 'Felder auf einem Raster anklicken', component: CellsCanvas, formLike: false,
    create: () => ({
      id: uid(), type: 'cells', question: '', hint: '', rows: 4, cols: 4, bg: '', bgAlt: '', aspect: 1,
      walls: [], start: null, goal: null, answers: [[]],
    }),
  },
};
