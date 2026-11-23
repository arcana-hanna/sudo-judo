<script lang="ts">
  // Auswahl zwischen wenigen Möglichkeiten (statt Aufklappliste): alles auf einen Blick.
  let { options, value, label, onchange }:
    { options: { value: string | number; label: string; title?: string }[]; value: string | number; label: string; onchange: (v: any) => void } = $props();
</script>

<div class="seg" role="group" aria-label={label}>
  {#each options as o (o.value)}
    <button class:on={value === o.value} aria-pressed={value === o.value} title={o.title} onclick={() => onchange(o.value)}>{o.label}</button>
  {/each}
</div>

<style>
  .seg { display: inline-flex; border: 2px solid var(--line); border-radius: 8px; overflow: hidden; }
  .seg button { border: 0 !important; border-radius: 0 !important; padding: .3rem .7rem !important; font-size: .9rem; font-weight: 600; background: var(--paper) !important; color: var(--ink); }
  .seg button + button { border-left: 2px solid var(--line) !important; }
  .seg button.on { background: var(--ink) !important; color: var(--paper); }
</style>
