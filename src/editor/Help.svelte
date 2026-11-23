<script lang="ts">
  let { dialog = $bindable() }: { dialog: HTMLDialogElement } = $props();
</script>

<dialog bind:this={dialog} aria-labelledby="help-title">
  <h2 id="help-title">So funktioniert Sudo-Judo</h2>
  <ol>
    <li><strong>Seiten anlegen:</strong> Links auf „+ Seite“ klicken und eine Vorlage wählen oder mit einer leeren Seite beginnen. Die Reihenfolge änderst du durch Ziehen am Griff.</li>
    <li><strong>Direkt im Blatt schreiben:</strong> Was du siehst, sehen auch die Schüler. Klicke auf einen Text, eine Antwort oder eine Karte und tippe los.</li>
    <li><strong>Inhalte hinzufügen:</strong> Zwischen den Blöcken erscheint beim Darüberfahren ein „+“. Unten gibt es immer „+ Inhalt hinzufügen“.</li>
    <li><strong>Die Lösung festlegen:</strong> Bei Auswahlaufgaben klickst du den Kreis neben der richtigen Antwort. Bei Reihenfolge und Zuordnen bringst du die Karten selbst in die richtige Ordnung bzw. Gruppe – das <em>ist</em> die Lösung.</li>
    <li><strong>Ausprobieren:</strong> Jeder Block hat oben rechts „▶ Ausprobieren“. Oben in der Leiste probierst du die ganze Aufgabensammlung aus.</li>
    <li><strong>Hinweise:</strong> Fehlt etwas (z. B. keine richtige Antwort markiert), steht direkt am Block ein Hinweis. Oben zeigt „Alles fertig“ oder die Zahl der Hinweise.</li>
    <li><strong>Weitergeben:</strong> „Weitergeben“ speichert <em>eine einzelne HTML-Datei</em>. Sie läuft ohne Internet und lässt sich per Link, Lernplattform oder USB-Stick verteilen.</li>
    <li><strong>Später weiterarbeiten:</strong> Die Datei kannst du über „Datei → Öffnen“ wieder laden und ändern. Sie ist zugleich dein Original – bewahre sie gut auf.</li>
  </ol>
  <h3>Gut zu wissen</h3>
  <ul>
    <li>Der Editor sichert deinen Entwurf automatisch in diesem Browser. „Weitergeben“ bleibt trotzdem die sichere Kopie.</li>
    <li>Die Lösungen stehen in der Datei. Für Spiel und Übung ist das in Ordnung, für Klassenarbeiten nicht geeignet.</li>
    <li>Schüler-Fortschritt wird nur auf dem jeweiligen Gerät gespeichert und lässt sich im Menü zurücksetzen.</li>
    <li>Tastatur: Strg+Z rückgängig, Strg+Y wiederholen, Strg+S weitergeben.</li>
  </ul>
  <form method="dialog"><button class="primary" autofocus>Schließen</button></form>
</dialog>

<style>
  dialog { border: 2px solid var(--ink); border-radius: var(--radius); padding: 1.25rem 1.5rem; width: min(42rem, 92vw); max-height: 88vh; overflow: auto; color: var(--ink); background: var(--paper); }
  dialog::backdrop { background: rgba(28, 43, 51, .5); }
  h2 { margin: 0 0 .75rem; font-size: 1.3rem; }
  h3 { margin: 1.1rem 0 .4rem; font-size: 1rem; }
  li { margin-bottom: .4rem; }
  form { margin-top: 1rem; text-align: right; }
</style>
