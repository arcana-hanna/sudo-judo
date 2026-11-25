// Browser-Speicher mit Namensraum "sudo-judo:". Daten unter dem alten Namensraum "raetselbox:"
// werden beim ersten Lesen automatisch übernommen, damit weder Entwürfe noch Lernfortschritt verloren gehen.
export const NS = 'sudo-judo:';
export const OLD_NS = 'raetselbox:';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Der Zugriff auf localStorage kann selbst eine Ausnahme auslösen (blockierte Cookies, privater Modus) – daher innerhalb von try.
export function readStored(suffix: string, injected?: Store): string | null {
  try {
    const store: Store = injected ?? localStorage;
    const current = store.getItem(NS + suffix);
    if (current !== null) return current;
    const old = store.getItem(OLD_NS + suffix);
    if (old === null) return null;
    try {
      store.setItem(NS + suffix, old);        // erst kopieren …
      store.removeItem(OLD_NS + suffix);      // … dann den alten Eintrag entfernen
    } catch { /* Übernahme nicht möglich (z. B. Speicher voll): den Wert trotzdem liefern, alter Eintrag bleibt */ }
    return old;
  } catch { return null; }
}

export function writeStored(suffix: string, value: string, injected?: Pick<Storage, 'setItem'>): boolean {
  try { (injected ?? localStorage).setItem(NS + suffix, value); return true; } catch { return false; }
}
