<script lang="ts">
  // Die zwei Arbeitsschritte jeder Aufgabe: aufbauen, dann die Lösung vormachen.
  let { step = $bindable('build'), solveLabel = 'Lösung vormachen', buildLabel = 'Aufgabe aufbauen' }:
    { step: 'build' | 'solve'; solveLabel?: string; buildLabel?: string } = $props();
</script>

<div class="steps" role="group" aria-label="Arbeitsschritt">
  <button class:on={step === 'build'} aria-pressed={step === 'build'} onclick={() => (step = 'build')}><span class="n">1</span> {buildLabel}</button>
  <span class="arrow" aria-hidden="true">›</span>
  <button class:on={step === 'solve'} aria-pressed={step === 'solve'} onclick={() => (step = 'solve')}><span class="n">2</span> {solveLabel}</button>
</div>

<style>
  .steps { display: flex; align-items: center; gap: .3rem; margin: .5rem 0 .6rem; flex-wrap: wrap; }
  .steps button { display: inline-flex; align-items: center; gap: .45rem; border-radius: 999px !important; padding: .3rem .85rem .3rem .35rem !important; font-size: .9rem; font-weight: 600; color: var(--muted); border-color: var(--line) !important; background: var(--paper) !important; }
  .steps button.on { color: var(--accent-ink); background: var(--accent) !important; border-color: var(--accent) !important; }
  .n { display: inline-grid; place-items: center; width: 1.4rem; height: 1.4rem; border-radius: 50%; background: var(--wash); color: var(--ink); font-size: .8rem; }
  .on .n { background: #fff; color: var(--accent); }
  .arrow { color: var(--muted); }
</style>
