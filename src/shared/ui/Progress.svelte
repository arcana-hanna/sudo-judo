<script lang="ts">
  import { BELTS, beltFor, nextBelt } from '../belts';
  import Belt from './Belt.svelte';
  let { done, total, mode = 'plain' }: { done: number; total: number; mode?: 'plain' | 'belts' } = $props();
  const belts = $derived(mode === 'belts');
  const rank = $derived(beltFor(done, total));
  const next = $derived(nextBelt(done, total));
</script>

<div class="sum">
  {#if belts}<div class="belt"><Belt level={rank} size={136} /></div>{/if}
  <div class="txt">
    {#if belts}
      <p class="rank">{next ? `Du trägst den ${BELTS[rank].gen} Gürtel.` : 'Du trägst den schwarzen Gürtel – alle Aufgaben geschafft!'}</p>
    {/if}
    <p>{done} von {total} Aufgaben gelöst</p>
    <progress max={total} value={done} aria-label="Fortschritt"></progress>
    {#if belts && next}
      <p class="next">Noch {next.missing} {next.missing === 1 ? 'Aufgabe' : 'Aufgaben'} bis zum {BELTS[next.belt].gen} Gürtel.</p>
    {/if}
  </div>
</div>

<style>
  .sum { margin: 0 0 1.25rem; display: flex; align-items: center; gap: 1.2rem; }
  .txt { flex: 1; min-width: 0; }
  .sum p { margin: 0 0 .3rem; color: var(--muted); font-size: 1rem; }
  .sum p.rank { color: var(--ink); font-weight: 700; font-size: 1.15rem; }
  .sum p.next { margin: .4rem 0 0; font-size: .95rem; }
  progress { -webkit-appearance: none; appearance: none; display: block; width: 100%; height: .8rem; border: 0; border-radius: 999px; overflow: hidden; background: var(--line); }
  progress::-webkit-progress-bar { background: var(--line); border-radius: 999px; }
  progress::-webkit-progress-value { background: var(--accent); border-radius: 999px; }
  progress::-moz-progress-bar { background: var(--accent); border-radius: 999px; }
  .belt { flex: none; }
</style>
