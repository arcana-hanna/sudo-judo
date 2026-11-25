# Sudo-Judo

Editor für Lernseiten und Informatik-Aufgaben im Stil der Informatik-Wettbewerbe – mit Scratch-ähnlichen Blöcken und Python-Ansicht.
Jede fertige Sammlung ist **eine einzelne HTML-Datei**, die offline läuft und sich wieder in den Editor laden lässt.

## So bedient man den Editor
- **Das Blatt ist die Schüleransicht.** Texte, Antworten und Karten schreibt man direkt dort, wo sie später stehen.
- **Lösung durch Vormachen:** Auswahl – Kreis neben der richtigen Antwort anklicken; Reihenfolge – Karten in die richtige Ordnung ziehen;
  Zuordnen – Karten in die richtige Gruppe legen (Ziehen oder Alt + ← →).
- **„+“ zwischen den Blöcken** und „+ Inhalt hinzufügen“ öffnen die Block-Auswahl (nach Aufgabe gruppiert, mit Piktogrammen).
- **„▶ Ausprobieren“** gibt es pro Block (in der Leiste am Block) und für die ganze Aufgabensammlung (oben).
- **Hinweise** erscheinen am Block selbst; oben zeigt „Alles fertig“ bzw. die Zahl der Hinweise.
- **Weitergeben** speichert die HTML-Datei; Neu/Öffnen/Hilfe stehen im Menü „Datei“.
- **Zwei Schritte pro Aufgabe** bei Pixelbild, Felder, Graph, Lücken/Plätze und Folge: **① Aufgabe aufbauen** (so sehen es die Schüler) und
  **② Lösung vormachen** (die Aufgabe selbst lösen – das ist die Lösung; „+ weitere Lösung“ für zusätzliche richtige Lösungen).
  Beim Graph-Färben entfällt Schritt 2, der Computer prüft jede gültige Färbung.
- Lückentext: Die Plätze entstehen automatisch aus den `___` im Text.
- **Roboter-Aufgaben** haben ebenfalls zwei Schritte: im Aufbau zeichnest du das Spielfeld (Symbol-Werkzeuge), schaltest erlaubte Blöcke ein/aus
  (in den Blockfarben) und legst Variablen und Block-Limit fest; in Schritt 2 baust du die Musterlösung im selben Block-Editor wie die Schüler und
  siehst sofort, ob sie das Ziel erreicht. Bei „Ergebnis vorhersagen“ zeigt Schritt 2 die vom Computer berechnete Antwort.
- Alle Aufgabentypen werden direkt im Schülerlayout bearbeitet; Werkzeuge haben Symbole. Karten lassen sich auch ohne Ziehen/Tastatur per ◀ ▶ verschieben.
- Aufbau: `src/editor/canvas/` (Bearbeiten im Schülerlayout), `src/editor/ui/` (Blockkarte, Auswahl, Menü, Textfelder).

## Aussehen, Gürtel, Dunkelmodus
- **Zwei Themes** je Sammlung (Menü „Datei → Aussehen“): **Klar** (schlicht, Standard) und **Dojo** (warm, rund, mit Wellenmuster und Gürteln – für jüngere Schüler).
  Beide folgen automatisch dem hellen oder dunklen Modus des Geräts. Farben und Formen stehen in `src/shared/theme.css`
  (Blöcke zwischen `@theme … @end` werden von `scripts/contrast.test.mjs` auf Lesbarkeit geprüft), Namen und Standardtitel in `src/shared/brand.ts`.
- **Gürtel** (`src/shared/belts.ts`): sieben Stufen Weiß → Schwarz. Als **Schwierigkeit** legt man sie pro Aufgabe fest („+ Schwierigkeit festlegen“);
  als **Fortschritt** steigt der Schüler mit den gelösten Aufgaben auf (Schwarz erst, wenn alles gelöst ist). Im Dojo-Theme als Gürtelgrafik, im Theme „Klar“ als Farbpunkt.
- **Texte je Theme** (`src/shared/theme.svelte.ts`): Im Dojo-Theme z. B. „Ippon! Richtig!“, „Tipp vom Sensei:“ und „Zum Dojo“.
- **Speicher:** Entwürfe und Lernfortschritt liegen unter `sudo-judo:…`; Daten unter dem alten Namensraum `raetselbox:…` werden automatisch übernommen (`src/shared/storage.ts`).
- `npm run test:e2e` enthält einen Kontrast-Scanner (`scripts/e2e_theme.py`), der in allen vier Kombinationen (Klar/Dojo × hell/dunkel) jeden sichtbaren Text in Editor und Schüleransicht prüft.

## Aufgabentypen
| Typ | Was die Schüler tun | Besonderheiten |
|---|---|---|
| Auswahlaufgabe | Antwort(en) ankreuzen | Bilder in den Antworten |
| Reihenfolge | Karten ordnen | Bilder; entweder genau eine Reihenfolge **oder Regeln** („A vor B“), der Editor zählt die gültigen Reihenfolgen |
| Zuordnung | Karten in Gruppen sortieren | Bilder auf den Karten |
| Gitter | Pixelbild färben | mehrere richtige Lösungen |
| Graph | Knoten/Kanten markieren oder Knoten färben | Pfeile, Gewichte/Beschriftungen, Knotenformen und -farben, mehrere richtige Lösungen |
| Folge | Folge aus Bausteinen bilden | beliebig viele richtige Folgen |
| Plätze/Lücken | Karten auf Plätze setzen | Layouts: Liste, Lückentext (`___`), Platz auf einem Bild; Eingabe per Klick/Ziehen oder Auswahlliste; Karten einzeln, mehrfach oder unbegrenzt |
| Felder | Felder auf einem Raster wählen | Wände zwischen Feldern, Start/Ziel, optionales Hintergrundbild, mehrere richtige Lösungen |
| Roboter | Programm bauen/reparieren/vorhersagen | Scratch-Blöcke mit Python-Ansicht |

Neue Felder in den Projektdaten sind optional – ältere Projekte und exportierte Dateien öffnen sich unverändert
(`scripts/fixtures/project-v1-sample.json` und ein Test sichern das ab).

## Funktionen für Lehrkräfte
Seitenvorlagen-Galerie, „Kontrolle“ (listet unfertige Aufgaben, warnt vor dem Export), Seiten und Blöcke duplizieren,
Rückgängig/Wiederholen, Strg+S zum Exportieren, Hilfe-Dialog. Ein Warnbanner erscheint, wenn der Browser das automatische Speichern verweigert.

## Funktionen für Schüler
Menü mit Fortschrittsanzeige, Fortschritt pro Gerät (zurücksetzbar, funktioniert auch ohne Speicher), Tastaturbedienung für alle
Aufgabentypen, Fokus auf die Überschrift bei Seitenwechsel, Farben nach WCAG AA (4,5:1).

## Entwickeln
    npm install
    npm run build        # baut zuerst player-dist/, dann den Editor nach dist/
    npm run dev          # Editor mit Hot-Reload (Player wird einmal vorab gebaut)
    npm run test:unit       # Simulator, Python-Ausgabe, Kontraste, Kontrolle (Node >= 22)
    npm run test:e2e        # Browser-Tests, 5 Skripte (python, playwright, pillow; vorher npm run build)

Der Editor (`dist/index.html`) ist selbst eine Einzeldatei: lokal per Doppelklick nutzbar.

## GitHub Pages
Repo auf GitHub anlegen, nach `main` pushen, unter *Settings → Pages → Source* „GitHub Actions“ wählen. Der Workflow `.github/workflows/deploy.yml` veröffentlicht den Editor.

## Aufbau
- `src/shared/` Projektformat (`types.ts`), Migration, Fortschritt, Theme
- `src/player/` Schüleransicht + Aufgabentypen (`registry.ts`, `blocks/`)
- `src/editor/` Editor: `canvas/` (Bearbeiten im Schülerlayout, ein Canvas je Aufgabentyp), `ui/` (Blockkarte, Auswahl, Menü, Werkzeugleiste, Textfelder), `registry.ts`
- `src/editor/io.ts` Export (Player-Vorlage + eingebettetes JSON) und Re-Import

## Neuen Aufgabentyp hinzufügen
1. Typ in `src/shared/types.ts` ergänzen.
2. `src/player/blocks/Neu.svelte` (Schüleransicht; Props `block`, `solved`, `onsolved`) und in `src/player/registry.ts` eintragen.
3. `src/editor/canvas/NeuCanvas.svelte` (Props `block = $bindable()`; Schritte „aufbauen/Lösung vormachen“ mit `ui/Steps.svelte`) und in `src/editor/registry.ts` eintragen (mit `create()`, `label`, `desc`).

## Programmieraufgaben (Roboter)
Ein Programm ist eine sprachunabhängige Struktur (`Program` in `src/shared/types.ts`).
Daraus entstehen drei Dinge: die Scratch-artigen Blöcke (`src/shared/ui/BlockEditor.svelte`), der Simulator
(`src/shared/robot/sim.ts`) und die Python-Ansicht (`src/shared/robot/python.ts`).

Roboter-Funktionen in der Python-Ansicht: `move()`, `turn_left()`, `turn_right()`, `wall_ahead()`, `wall_left()`,
`wall_right()`, `on_goal()`. Schleifen/Bedingungen/Variablen/Funktionen entsprechen den Blöcken 1:1
(`for _ in range(n)`, `if/else`, `while`, `x += 1`, `def …()` mit `global`).

Aufgabentypen: Programm bauen (optional mit Blocklimit), Programm reparieren (Startprogramm gefüllt),
Ergebnis vorhersagen (Endfeld oder Variablenwert). Die Musterlösung wird im Editor automatisch auf Lösbarkeit geprüft.

Tests: `npm run test:robot` (Simulator, Baumoperationen, Python-Ausgabe; Node ≥ 22).

Geplant: Python-Eingabe als Zusatz – ein kleiner Parser für eine Python-Teilmenge, der in dieselbe `Program`-Struktur übersetzt.
