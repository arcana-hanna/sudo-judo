<script lang="ts">
  // Umschalter zwischen mehreren richtigen Lösungen einer Aufgabe.
  let { count, cur = $bindable(), onadd, ondel }:
    { count: number; cur: number; onadd: () => void; ondel: () => void } = $props();
</script>

<div class="tabs" role="tablist" aria-label="Richtige Lösungen">
  {#each Array(count) as _, k (k)}
    <button role="tab" class="small" class:on={k === cur} aria-selected={k === cur} onclick={() => (cur = k)}>Lösung {k + 1}</button>
  {/each}
  <button class="small" onclick={onadd} title="Weitere richtige Lösung hinzufügen (Kopie der aktuellen)">+ weitere Lösung</button>
  {#if count > 1}<button class="small danger" onclick={ondel}>Diese Lösung löschen</button>{/if}
</div>

<style>
  .tabs { display: flex; flex-wrap: wrap; gap: .35rem; margin-bottom: .4rem; }
</style>
