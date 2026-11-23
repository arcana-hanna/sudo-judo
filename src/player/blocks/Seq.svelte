<script lang="ts">
  import type { SeqBlock } from '../../shared/types';
  import SeqBuilder from '../../shared/ui/SeqBuilder.svelte';
  let { block, solved = false, onsolved }:
    { block: SeqBlock; solved?: boolean; onsolved?: () => void } = $props();

  let value = $state<string[]>([]);
  let result = $state<'idle' | 'ok' | 'no'>('idle');

  $effect(() => { if (solved) { value = [...(block.answers[0] ?? [])]; result = 'ok'; } });
  $effect(() => { value.length; if (!solved) result = 'idle'; });   // nach jeder Änderung Meldung zurücksetzen

  function check() {
    const ok = block.answers.some((a) => a.length === value.length && a.every((t, i) => t === value[i]));
    result = ok ? 'ok' : 'no';
    if (ok) onsolved?.();
  }
</script>

<fieldset class="ex" class:solved>
  <legend>{block.question}</legend>
  {#if !solved}<p class="note">Wähle Bausteine aus. Klicke einen Baustein in deiner Folge an, um ihn zu entfernen.</p>{/if}
  <SeqBuilder tokens={block.tokens} bind:value maxLen={block.maxLen} readonly={solved} />
  <div class="row">
    <button class="check" onclick={check} disabled={solved || value.length === 0}>Prüfen</button>
    <p class="msg" role="status">
      {#if result === 'ok'}<span class="ok">Richtig!</span>
      {:else if result === 'no'}<span class="no">Noch nicht ganz.</span>
        {#if block.hint}<span>Tipp: {block.hint}</span>{/if}
      {/if}
    </p>
  </div>
</fieldset>

<style>
  .ex { border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem 1.25rem 1.25rem; margin: 0 0 1.5rem; min-width: 0; }
  .ex.solved { border-color: var(--good); }
  legend { font-weight: 650; font-size: 1.15rem; padding: 0 .5rem; margin-left: -.5rem; max-width: 60ch; }
  .note { color: var(--muted); margin: 0 0 .75rem; font-size: .95rem; }
  .row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
  .check { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: var(--radius); padding: .6rem 1.4rem; font-weight: 650; cursor: pointer; }
  .check:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .msg { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
  .ok { color: var(--good); font-weight: 650; }
  .no { color: var(--bad); font-weight: 650; }
</style>
