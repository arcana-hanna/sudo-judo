<script lang="ts">
  import { str } from '../../shared/theme.svelte';
  import { untrack } from 'svelte';
  import type { GridBlock } from '../../shared/types';
  import GridBoard from '../../shared/ui/GridBoard.svelte';
  let { block, solved = false, onsolved }:
    { block: GridBlock; solved?: boolean; onsolved?: () => void } = $props();

  let cells = $state<number[]>(untrack(() => block.start.slice()));
  let result = $state<'idle' | 'ok' | 'no'>('idle');
  $effect(() => { if (solved) { cells = block.target.slice(); result = 'ok'; } });

  function pick(i: number) {
    cells[i] = (cells[i] + 1) % block.colors;
    result = 'idle';
  }
  function check() {
    const ok = [block.target, ...(block.alts ?? [])].some((t) => cells.length === t.length && cells.every((v, i) => v === t[i]));
    result = ok ? 'ok' : 'no';
    if (ok) onsolved?.();
  }
</script>

<fieldset class="ex" class:solved>
  <legend>{block.question}</legend>
  {#if !solved}<p class="note">Klicke ein Feld, um die Farbe zu wechseln.</p>{/if}
  <GridBoard {cells} cols={block.cols} onpick={pick} disabled={solved} label={block.question} />
  <div class="row">
    <button class="check" onclick={check} disabled={solved}>Prüfen</button>
    <p class="msg" role="status">
      {#if result === 'ok'}<span class="ok">{str().ok}</span>
      {:else if result === 'no'}<span class="no">{str().no}</span>
        {#if block.hint}<span>{str().tip} {block.hint}</span>{/if}
      {/if}
    </p>
  </div>
</fieldset>

<style>
  .ex { border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem 1.25rem 1.25rem; margin: 0 0 1.5rem; }
  .ex.solved { border-color: var(--good); }
  legend { font-weight: 650; font-size: 1.15rem; padding: 0 .5rem; margin-left: -.5rem; max-width: 60ch; }
  .note { color: var(--muted); margin: 0 0 .75rem; font-size: .95rem; }
  .row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
  .check { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: var(--btn-radius); padding: .6rem 1.4rem; font-weight: 650; cursor: pointer; }
  .check:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .msg { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
  .ok { color: var(--good); font-weight: 650; }
  .no { color: var(--bad); font-weight: 650; }
</style>
