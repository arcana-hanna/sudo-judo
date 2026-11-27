// Welches Theme gerade aktiv ist, und die Texte, die sich je Theme unterscheiden.
import type { ThemeId } from './themes';
export { THEMES, isThemeId, normalizeTheme } from './themes';
export type { ThemeId } from './themes';

export const theme = $state<{ id: ThemeId }>({ id: 'klar' });

const S = {
  klar: {
    ok: 'Richtig!', no: 'Noch nicht ganz.', tip: 'Tipp:', menu: 'Menü',
    levelText: (name: string, _nom: string) => `Stufe ${name}`,
  },
  bunt: {
    ok: 'Super, richtig!', no: 'Noch nicht ganz – versuch es noch einmal!', tip: 'Tipp vom Trainer:', menu: 'Zur Übersicht',
    levelText: (_name: string, nom: string) => `${nom} Gürtel`,
  },
};
/** Texte des aktuellen Themes (in Vorlagen aufrufen: `{str().ok}` – aktualisiert sich bei Wechsel). */
export const str = () => S[theme.id];
