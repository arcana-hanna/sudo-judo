<script lang="ts">
  import { BELTS } from '../../shared/belts';
  let { value = $bindable() }: { value: number | undefined } = $props();
  let open = $state(false);
  const shown = $derived(open || typeof value === 'number');
</script>

{#if shown}
  <div class="lvl" role="group" aria-label="Schwierigkeit">
    <span class="lab">Schwierigkeit:</span>
    {#each BELTS as b, i (b.name)}
      <button class="b" class:on={value === i} aria-pressed={value === i} onclick={() => (value = i)}>
        <span class="sw" style="background:{b.color}" aria-hidden="true"></span>{b.name}</button>
    {/each}
    <button class="x" onclick={() => { value = undefined; open = false; }} aria-label="Schwierigkeit entfernen" title="Schwierigkeit entfernen">✕</button>
  </div>
{:else}
  <button class="addlvl" onclick={() => (open = true)}>+ Schwierigkeit festlegen</button>
{/if}

<style>
  .lvl { display: flex; align-items: center; flex-wrap: wrap; gap: .3rem; margin-top: .6rem; font-size: .9rem; }
  .lab { color: var(--muted); margin-right: .2rem; }
  .b { display: inline-flex; align-items: center; gap: .35rem; padding: .15rem .6rem !important; border-radius: 999px !important; font-size: .85rem; }
  .b.on { background: var(--ink) !important; color: var(--paper); border-color: var(--ink) !important; }
  .sw { width: .8rem; height: .8rem; border-radius: 50%; border: 1.5px solid var(--ink); }
  .x { background: none; border: 0 !important; color: var(--muted); padding: .2rem .4rem !important; }
  .addlvl { margin-top: .5rem; margin-right: 1rem; background: none !important; border: 0 !important; padding: .2rem 0 !important; color: var(--accent); font-size: .95rem; text-decoration: underline; text-underline-offset: 3px; font-weight: 400 !important; }
</style>
