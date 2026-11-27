<script lang="ts">
  import { BELTS } from '../belts';
  import { theme, str } from '../theme.svelte';
  import Belt from './Belt.svelte';
  let { level }: { level: number } = $props();
  const b = $derived(BELTS[Math.min(BELTS.length - 1, Math.max(0, Math.round(level) || 0))]);
</script>

<span class="pill" class:bunt={theme.id === 'bunt'} title="Schwierigkeit">
  {#if theme.id === 'bunt'}<Belt {level} size={38} decorative />{:else}<span class="dot" style="background:{b.color}" aria-hidden="true"></span>{/if}
  <span>{str().levelText(b.name, b.nom)}</span>
</span>

<style>
  .pill { display: inline-flex; align-items: center; gap: .4rem; padding: .1rem .7rem .1rem .45rem; border: 2px solid var(--line); border-radius: 999px; font-size: .85rem; font-weight: 600; color: var(--ink); background: var(--paper); }
  .pill.bunt { padding-left: .25rem; }
  .dot { width: .8rem; height: .8rem; border-radius: 50%; border: 1.5px solid var(--ink); opacity: .9; }
</style>
