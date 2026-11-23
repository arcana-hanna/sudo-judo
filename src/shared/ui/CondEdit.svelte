<script lang="ts">
  import type { Cond } from '../types';
  import { condText } from '../robot/tree';
  import ValEdit from './ValEdit.svelte';
  let { c = $bindable(), vars, readonly = false }:
    { c: Cond; vars: string[]; readonly?: boolean } = $props();
</script>

{#if readonly}
  <span class="ro">{condText(c)}</span>
{:else}
  <label class="not"><input type="checkbox" bind:checked={c.not} /> nicht</label>
  <select bind:value={c.kind} aria-label="Bedingung">
    <option value="wallAhead">Wand voraus</option>
    <option value="wallLeft">Wand links</option>
    <option value="wallRight">Wand rechts</option>
    <option value="onGoal">am Ziel</option>
    {#if vars.length}<option value="cmp">Variable vergleichen</option>{/if}
  </select>
  {#if c.kind === 'cmp'}
    <select bind:value={c.v} aria-label="Variable">{#each vars as n}<option value={n}>{n}</option>{/each}</select>
    <select bind:value={c.op} aria-label="Vergleich">
      <option value="<">&lt;</option><option value=">">&gt;</option><option value="==">=</option><option value="!=">≠</option>
    </select>
    <ValEdit bind:val={c.val} {vars} />
  {/if}
{/if}

<style>
  .ro { background: #fff; color: var(--ink); border-radius: 12px; padding: 0 .6rem; font-weight: 700; }
  select { border: 0; border-radius: 12px; padding: .15rem .35rem; background: #fff; color: var(--ink); font: inherit; font-weight: 600; }
  .not { display: inline-flex; align-items: center; gap: .2rem; font-size: .9rem; }
</style>
