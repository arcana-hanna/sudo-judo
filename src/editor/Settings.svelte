<script lang="ts">
  import { app } from './state.svelte';
  import Seg from './ui/Seg.svelte';
  import { THEMES, normalizeTheme, type ProgressMode } from '../shared/themes';
  let { dialog = $bindable() }: { dialog: HTMLDialogElement } = $props();

  const themeId = $derived(normalizeTheme(app.project.theme));
  const progress = $derived<ProgressMode>(app.project.progress === 'off' || app.project.progress === 'belts' ? app.project.progress : 'plain');
  const themeDesc = $derived((d => d.charAt(0).toUpperCase() + d.slice(1))(THEMES.find((t) => t.id === themeId)?.desc ?? ''));
  const progressDesc: Record<ProgressMode, string> = {
    off: 'Die Schüler sehen keinen Fortschritt, und es wird nichts gespeichert – ideal für einzelne Aufgaben oder Übungen, die man beliebig oft wiederholt.',
    plain: 'Fortschrittsbalken und „x von y gelöst“. Gelöste Aufgaben werden auf dem Gerät gemerkt.',
    belts: 'Wie „Einfach“, dazu steigen die Schüler mit den gelösten Aufgaben vom weißen zum schwarzen Gürtel auf.',
  };
</script>

<dialog bind:this={dialog} aria-labelledby="set-title">
  <h2 id="set-title">Einstellungen für diese Sammlung</h2>

  <section>
    <h3>Aussehen</h3>
    <Seg label="Aussehen" value={themeId} onchange={(v) => (app.project.theme = v)} options={THEMES.map((t) => ({ value: t.id, label: t.name }))} />
    <p class="d">{themeDesc}. Beide Varianten passen sich dem hellen oder dunklen Modus des Geräts an.</p>
  </section>

  <section>
    <h3>Fortschritt</h3>
    <Seg label="Fortschritt" value={progress} onchange={(v) => (app.project.progress = v)}
      options={[{ value: 'off', label: 'Ohne' }, { value: 'plain', label: 'Einfach' }, { value: 'belts', label: 'Mit Gürteln' }]} />
    <p class="d">{progressDesc[progress]}</p>
  </section>

  <section>
    <h3>Schwierigkeit</h3>
    <label class="chk"><input type="checkbox" checked={!!app.project.levels} onchange={(e) => (app.project.levels = e.currentTarget.checked)} />
      Schwierigkeitsstufen (Gürtelfarben) an Aufgaben verwenden</label>
    <p class="d">Du legst dann bei jeder Aufgabe eine Stufe fest, und die Schüler sehen sie an der Aufgabe. Ohne Häkchen gibt es keine Schwierigkeitsangaben – bereits eingestellte Stufen bleiben gespeichert.</p>
  </section>

  <form method="dialog"><button class="primary" autofocus>Fertig</button></form>
</dialog>

<style>
  dialog { border: 1px solid var(--ink); border-radius: 12px; padding: 1.25rem 1.5rem; width: min(38rem, 94vw); max-height: 90vh; overflow: auto; color: var(--ink); background: var(--paper); }
  dialog::backdrop { background: rgba(28, 43, 51, .5); }
  h2 { margin: 0 0 .5rem; font-size: 1.3rem; }
  h3 { margin: 1.2rem 0 .4rem; font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
  .d { margin: .5rem 0 0; color: var(--muted); font-size: .92rem; max-width: 60ch; }
  .chk { display: flex; gap: .5rem; align-items: center; }
  form { margin-top: 1.2rem; text-align: right; }
</style>
