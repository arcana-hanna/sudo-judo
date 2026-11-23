<script lang="ts">
  import { editorBlocks, groups } from '../registry';
  import { icons } from '../icons';
  let { dialog = $bindable(), onpick }: { dialog: HTMLDialogElement; onpick: (type: string) => void } = $props();
</script>

<dialog bind:this={dialog} aria-labelledby="pick-title">
  <h2 id="pick-title">Was möchtest du hinzufügen?</h2>
  {#each groups as g (g.name)}
    <h3>{g.name}</h3>
    <div class="cards">
      {#each g.types as t (t)}
        {@const def = editorBlocks[t]}
        <button class="pick" onclick={() => { dialog.close(); onpick(t); }}>
          <span class="ic">{@html icons[t]}</span>
          <span class="tx"><strong>{def.label}</strong><span>{def.desc}</span></span>
        </button>
      {/each}
    </div>
  {/each}
  <form method="dialog"><button>Abbrechen</button></form>
</dialog>

<style>
  dialog { border: 1px solid var(--ink); border-radius: 12px; padding: 1.25rem 1.5rem; width: min(60rem, 94vw); max-height: 92vh; overflow: auto; color: var(--ink); background: var(--paper); }
  dialog::backdrop { background: rgba(28, 43, 51, .5); }
  h2 { margin: 0 0 .5rem; font-size: 1.3rem; }
  h3 { margin: 1.1rem 0 .4rem; font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); gap: .5rem; }
  .pick { display: flex; gap: .75rem; align-items: center; text-align: left; padding: .65rem .8rem !important; font-weight: 400 !important; }
  .ic { color: var(--accent); flex: none; display: grid; place-items: center; width: 2.6rem; height: 2.6rem; background: var(--wash); border-radius: 8px; }
  .tx { display: grid; gap: .1rem; } .tx strong { font-weight: 650; } .tx span { color: var(--muted); font-size: .85rem; }
  form { margin-top: 1rem; text-align: right; }
</style>
