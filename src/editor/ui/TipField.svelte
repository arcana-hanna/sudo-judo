<script lang="ts">
  import { tick } from 'svelte';
  import Inline from './Inline.svelte';
  let { value = $bindable('') }: { value: string } = $props();
  let open = $state(false);
  let box: HTMLDivElement | undefined = $state();
  const shown = $derived(open || !!value);
  async function show() { open = true; await tick(); box?.querySelector('input')?.focus(); }
  function clear() { value = ''; open = false; }
</script>

{#if shown}
  <div class="tip" bind:this={box}>
    <span class="lab">Tipp bei falscher Antwort:</span>
    <Inline bind:value placeholder="z. B. „Denke an …“" label="Tipp bei falscher Antwort" />
    <button class="x" onclick={clear} aria-label="Tipp entfernen" title="Tipp entfernen">✕</button>
  </div>
{:else}
  <button class="addtip" onclick={show}>+ Tipp hinzufügen</button>
{/if}

<style>
  .tip { display: flex; align-items: center; gap: .5rem; margin-top: .9rem; padding: .35rem .6rem; background: var(--wash); border-radius: var(--radius); font-size: .95rem; }
  .lab { color: var(--muted); white-space: nowrap; }
  .x { background: none; border: 0; color: var(--muted); cursor: pointer; padding: .2rem .4rem; }
  .addtip { margin-top: .9rem; background: none; border: 0; padding: .2rem 0; color: var(--accent); font-size: .95rem; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
</style>
