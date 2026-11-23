import playerHtml from '../../player-dist/index.html?raw';
import { migrate } from '../shared/migrate';
import { FILE_FALLBACK } from '../shared/brand';
import type { Project } from '../shared/types';

const DATA_TAG = /(<script[^>]*\bid="project-data"[^>]*>)([\s\S]*?)(<\/script>)/;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Export: Player-Vorlage + eingebettetes Projekt = eine eigenständige HTML-Datei. */
export function buildHtml(project: Project): string {
  if (!DATA_TAG.test(playerHtml)) throw new Error('Player-Vorlage hat kein Datenfeld.');
  const json = JSON.stringify(project)
    .replace(/</g, '\\u003c')        // verhindert "</script>" im Inhalt
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return playerHtml
    .replace(DATA_TAG, (_m, open, _old, close) => open + json + close)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(project.title)}</title>`);
}

/** Import: liest ein Projekt aus einer exportierten HTML-Datei (oder reinem JSON). */
export function readProject(text: string): Project {
  const t = text.trim();
  if (t.startsWith('{')) return migrate(JSON.parse(t));
  const el = new DOMParser().parseFromString(text, 'text/html').getElementById('project-data');
  if (!el) throw new Error('In dieser Datei wurden keine Sudo-Judo-Daten gefunden.');
  return migrate(JSON.parse(el.textContent ?? ''));
}

export function download(project: Project) {
  const name = (project.title || FILE_FALLBACK).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || FILE_FALLBACK;
  const url = URL.createObjectURL(new Blob([buildHtml(project)], { type: 'text/html' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name + '.html' });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
