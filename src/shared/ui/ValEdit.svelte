<script lang="ts">
  import type { Val } from '../types';
  let { val = $bindable(), vars, readonly = false, min = -99 }:
    { val: Val; vars: string[]; readonly?: boolean; min?: number } = $props();
  const clamp = (n: number) => Math.max(min, Math.min(99, Math.round(n) || 0));
</script>

{#if readonly}
  <span class="ro">{val.v || val.n}</span>
{:else}
  {#if vars.length}
    <select bind:value={val.v} aria-label="Zahl oder Variable">
      <option value="">Zahl</option>
      {#each vars as n}<option value={n}>{n}</option>{/each}
    </select>
  {/if}
  {#if !val.v}
    <input type="number" class="num" aria-label="Zahl" value={val.n}
      onchange={(e) => (val.n = clamp(+e.currentTarget.value))} />
  {/if}
{/if}

<style>
  .ro { background: #fff; color: var(--ink); border-radius: 12px; padding: 0 .6rem; font-weight: 700; }
  select, .num { border: 0; border-radius: 12px; padding: .15rem .35rem; background: #fff; color: var(--ink); font: inherit; font-weight: 600; }
  .num { width: 3.6rem; }
</style>
