<script lang="ts">
  import { toolIcons } from '../icons';
  let { tools, value, onchange, label = 'Werkzeuge' }:
    { tools: { id: string; label: string; title?: string }[]; value: string; onchange: (id: any) => void; label?: string } = $props();
</script>

<div class="tb" role="toolbar" aria-label={label}>
  {#each tools as t (t.id)}
    <button class:on={value === t.id} aria-pressed={value === t.id} title={t.title} onclick={() => onchange(t.id)}>
      <span class="ic">{@html toolIcons[t.id]}</span>{t.label}
    </button>
  {/each}
</div>

<style>
  .tb { display: flex; gap: .35rem; flex-wrap: wrap; margin-bottom: .5rem; }
  .tb button { display: inline-flex; align-items: center; gap: .4rem; padding: .3rem .7rem !important; font-size: .9rem; border-radius: 8px !important; }
  .tb button.on { background: var(--ink) !important; color: var(--paper); border-color: var(--ink) !important; }
  .ic { display: inline-grid; place-items: center; }
</style>
