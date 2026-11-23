// Kleine Piktogramme für die Block-Auswahl (24 × 24, nur Formen – keine Schrift).
const wrap = (body: string) =>
  `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons: Record<string, string> = {
  text: wrap('<path d="M4 6h16M4 11h16M4 16h10"/>'),
  image: wrap('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/>'),
  mc: wrap('<circle cx="6" cy="7" r="2.6"/><circle cx="6" cy="7" r="0.9" fill="currentColor"/><circle cx="6" cy="17" r="2.6"/><path d="M12 7h9M12 17h9"/>'),
  order: wrap('<rect x="3" y="4" width="13" height="4" rx="1"/><rect x="3" y="10" width="13" height="4" rx="1"/><rect x="3" y="16" width="13" height="4" rx="1"/><path d="M20 6v12m0 0l-2-2m2 2l2-2"/>'),
  sort: wrap('<rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/><path d="M6 9h2M16 9h2M6 14h2"/>'),
  seq: wrap('<rect x="2.5" y="9" width="5" height="6" rx="1"/><rect x="9.5" y="9" width="5" height="6" rx="1"/><path d="M17 12h4m0 0l-2-2m2 2l-2 2"/>'),
  slots: wrap('<rect x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="3 3"/><rect x="7" y="9" width="10" height="6" rx="1"/>'),
  grid: wrap('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none"/>'),
  graph: wrap('<circle cx="6" cy="7" r="2.6"/><circle cx="18" cy="7" r="2.6"/><circle cx="12" cy="18" r="2.6"/><path d="M8.6 7h6.8M7.5 9.2l3.2 6.6M16.5 9.2l-3.2 6.6"/>'),
  cells: wrap('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" opacity=".45"/><path d="M12 10l1 2h2l-1.6 1.4.6 2L12 14.4 9.9 15.4l.6-2L9 12h2z" fill="currentColor" stroke="none"/>'),
  robot: wrap('<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 8V4M9.5 4h5"/><circle cx="9.5" cy="13" r="1.3" fill="currentColor" stroke="none"/><circle cx="14.5" cy="13" r="1.3" fill="currentColor" stroke="none"/><path d="M9.5 16.5h5"/>'),
};

// Werkzeug-Symbole (16 × 16)
const t = (body: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
export const toolIcons: Record<string, string> = {
  move: t('<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>'),
  node: t('<circle cx="12" cy="12" r="6"/><path d="M12 9v6M9 12h6"/>'),
  edge: t('<circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="5" r="2.5"/><path d="M7 17L17 7"/>'),
  label: t('<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.2" fill="currentColor"/>'),
  delete: t('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  wall: t('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 12h18M9 5v7M15 12v7"/>'),
  start: t('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  goal: t('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'),
  erase: t('<path d="M4 16l9-9 7 7-5 5H8z"/><path d="M12 20h8"/>'),
};
