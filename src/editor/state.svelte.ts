import { migrate } from '../shared/migrate';
import { uid, type Block, type Page, type Project } from '../shared/types';
import { blankProject, sampleProject } from './templates';
import { cloneWithNewIds } from './clone';

// Alter Präfix bleibt, damit vorhandene Entwürfe nach der Umbenennung erhalten bleiben.
const DRAFT = 'raetselbox:editor-draft';

function loadDraft(): Project {
  try { return migrate(JSON.parse(localStorage.getItem(DRAFT) ?? '')); }
  catch { return sampleProject(); }
}

const initial = loadDraft();
export const app = $state({
  project: initial,
  pageId: '',
  preview: false,
  storageOk: true,   // false, wenn der Browser das Speichern des Entwurfs verweigert
  dirty: false,      // Änderungen seit dem letzten Export/Öffnen
  saved: JSON.stringify(initial),
});
if (!app.project.pages.some((p) => p.id === app.pageId)) app.pageId = app.project.pages[0]?.id ?? '';

export function saveDraft() {
  try { localStorage.setItem(DRAFT, JSON.stringify(app.project)); app.storageOk = true; }
  catch { app.storageOk = false; }
}
export const markSaved = () => { app.saved = JSON.stringify(app.project); app.dirty = false; };

// --- Rückgängig / Wiederholen (Schnappschüsse des ganzen Projekts) ---
let past: string[] = [];
let future: string[] = [];
let current = JSON.stringify(app.project);
export const hist = $state({ canUndo: false, canRedo: false });
const refresh = () => { hist.canUndo = past.length > 0; hist.canRedo = future.length > 0; };

/** Hält den aktuellen Stand als Schritt fest (wird nach kurzer Pause aufgerufen). */
export function commit() {
  const s = JSON.stringify(app.project);
  if (s === current) return;
  past.push(current); if (past.length > 100) past.shift();
  current = s; future = []; refresh();
}
function restore(s: string) {
  app.project = JSON.parse(s); current = s;
  if (!app.project.pages.some((p) => p.id === app.pageId)) app.pageId = app.project.pages[0]?.id ?? '';
  refresh();
}
export function undo() {
  commit();
  const s = past.pop(); if (s === undefined) return;
  future.push(current); restore(s);
}
export function redo() {
  const s = future.pop(); if (s === undefined) return;
  past.push(current); restore(s);
}

export function setProject(p: Project) {
  app.project = p;
  past = []; future = []; current = JSON.stringify(p); refresh();
  app.saved = current; app.dirty = false;
  app.pageId = p.pages[0]?.id ?? '';
  app.preview = false;
}

export function addPage(page: Page = { id: uid(), title: 'Neue Seite', blocks: [] }) {
  const i = app.project.pages.findIndex((p) => p.id === app.pageId);
  app.project.pages.splice(i >= 0 ? i + 1 : app.project.pages.length, 0, page);
  app.pageId = page.id;
}
export const newProject = () => setProject(blankProject());

export function duplicatePage() {
  const src = app.project.pages.find((p) => p.id === app.pageId);
  if (!src) return;
  const copy = cloneWithNewIds($state.snapshot(src) as Page);
  copy.title += ' (Kopie)';
  addPage(copy);
}
export function duplicateBlock(page: Page, i: number) {
  page.blocks.splice(i + 1, 0, cloneWithNewIds($state.snapshot(page.blocks[i]) as Block));
}

export function movePage(dir: -1 | 1) {
  const ps = app.project.pages;
  const i = ps.findIndex((p) => p.id === app.pageId), j = i + dir;
  if (i < 0 || j < 0 || j >= ps.length) return;
  [ps[i], ps[j]] = [ps[j], ps[i]];
}

export function deletePage() {
  const ps = app.project.pages;
  const i = ps.findIndex((p) => p.id === app.pageId);
  if (i < 0) return;
  ps.splice(i, 1);
  app.pageId = ps[Math.min(i, ps.length - 1)]?.id ?? '';
}
