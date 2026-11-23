<script lang="ts">
  export interface MenuItem { label: string; onclick: () => void; danger?: boolean; disabled?: boolean }
  let { label, items, cls = '', title = '', align = 'right' }:
    { label: string; items: MenuItem[]; cls?: string; title?: string; align?: 'left' | 'right' } = $props();
  let open = $state(false);
  let root: HTMLDivElement | undefined = $state();
  const onWin = (e: Event) => { if (open && root && !root.contains(e.target as Node)) open = false; };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open = false; };
</script>

<svelte:window onclick={onWin} onkeydown={onKey} />

<div class="menu {cls}" bind:this={root}>
  <button class="mbtn" aria-haspopup="menu" aria-expanded={open} {title} onclick={() => (open = !open)}>{label}</button>
  {#if open}
    <div class="pop {align}" role="menu">
      {#each items as it (it.label)}
        <button role="menuitem" class:danger={it.danger} disabled={it.disabled}
          onclick={() => { open = false; it.onclick(); }}>{it.label}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .menu { position: relative; display: inline-block; }
  .pop { position: absolute; z-index: 30; top: calc(100% + 4px); min-width: 12rem; padding: .3rem; background: var(--paper);
         border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 8px 24px rgba(28, 43, 51, .18); display: grid; gap: 1px; }
  .pop.right { right: 0; } .pop.left { left: 0; }
  .pop button { text-align: left; border: 0 !important; background: none; padding: .5rem .7rem !important; border-radius: 6px; font-weight: 500 !important; white-space: nowrap; }
  .pop button:hover:not(:disabled) { background: var(--wash); }
  .pop button.danger { color: var(--bad); }
</style>
