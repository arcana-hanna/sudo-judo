// Welches Theme gerade aktiv ist, und die Texte, die sich je Theme unterscheiden.
export type ThemeId = 'klar' | 'dojo';
export const THEMES: { id: ThemeId; name: string; desc: string }[] = [
  { id: 'klar', name: 'Klar', desc: 'schlicht und sauber' },
  { id: 'dojo', name: 'Dojo', desc: 'bunt, mit Gürteln – für jüngere Schüler' },
];

export const theme = $state<{ id: ThemeId }>({ id: 'klar' });

const S = {
  klar: {
    ok: 'Richtig!', no: 'Noch nicht ganz.', tip: 'Tipp:', menu: 'Menü',
    levelText: (name: string, _nom: string) => `Stufe ${name}`,
    rank: (_gen: string) => '', allDone: '',
  },
  dojo: {
    ok: 'Ippon! Richtig!', no: 'Noch nicht ganz – versuch es noch einmal!', tip: 'Tipp vom Sensei:', menu: 'Zum Dojo',
    levelText: (_name: string, nom: string) => `${nom} Gürtel`,
    rank: (gen: string) => `Du trägst den ${gen} Gürtel.`,
    allDone: 'Du trägst den schwarzen Gürtel – alle Aufgaben geschafft!',
  },
};
/** Texte des aktuellen Themes (in Vorlagen aufrufen: `{str().ok}` – aktualisiert sich bei Wechsel). */
export const str = () => S[theme.id];
export const isThemeId = (v: unknown): v is ThemeId => v === 'klar' || v === 'dojo';
