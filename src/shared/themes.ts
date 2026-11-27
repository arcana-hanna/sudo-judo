// Themes (reine Daten, ohne Svelte – auch in Tests nutzbar).
export type ThemeId = 'klar' | 'bunt';
export const THEMES: { id: ThemeId; name: string; desc: string }[] = [
  { id: 'klar', name: 'Klar', desc: 'schlicht und sauber' },
  { id: 'bunt', name: 'Bunt', desc: 'warm und rund, mit Wellenmuster – für jüngere Schüler' },
];
export const isThemeId = (v: unknown): v is ThemeId => v === 'klar' || v === 'bunt';
/** Auch der frühere Name "dojo" wird erkannt, damit schon exportierte Dateien weiter funktionieren. */
export const normalizeTheme = (v: unknown): ThemeId => (v === 'bunt' || v === 'dojo' ? 'bunt' : 'klar');

export type ProgressMode = 'off' | 'plain' | 'belts';
export const PROGRESS_MODES: ProgressMode[] = ['off', 'plain', 'belts'];
