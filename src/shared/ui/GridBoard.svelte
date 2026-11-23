<script lang="ts">
  import { PALETTE, COLOR_NAMES } from '../palette';
  let { cells, cols, onpick, disabled = false, size = '2.75rem', label = 'Gitter' }:
    { cells: number[]; cols: number; onpick?: (i: number) => void; disabled?: boolean; size?: string; label?: string } = $props();
</script>

<div class="grid" role="group" aria-label={label} style="grid-template-columns: repeat({cols}, {size}); --size: {size}">
  {#each cells as v, i (i)}
    <button class="cell" {disabled} style="background: {PALETTE[v] ?? PALETTE[0]}"
      aria-label="Zeile {Math.floor(i / cols) + 1}, Spalte {(i % cols) + 1}: {COLOR_NAMES[v] ?? COLOR_NAMES[0]}"
      onclick={() => onpick?.(i)}></button>
  {/each}
</div>

<style>
  .grid { display: grid; gap: 3px; width: max-content; max-width: 100%; padding: 3px; background: var(--ink); border-radius: 4px; }
  .cell { width: var(--size); height: var(--size); border: 0; padding: 0; border-radius: 2px; cursor: pointer; }
  .cell:disabled { cursor: default; }
  .cell:hover:not(:disabled) { outline: 3px solid var(--accent); outline-offset: -3px; }
</style>
