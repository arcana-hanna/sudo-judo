<script lang="ts">
  import { uid, type McBlock } from '../../shared/types';
  import Inline from '../ui/Inline.svelte';
  import ImgField from '../ImgField.svelte';
  let { block = $bindable() }: { block: McBlock } = $props();
  let newId = $state('');
  function add() {
    const o = { id: uid(), text: '', correct: false };
    block.options.push(o); newId = o.id;
  }
</script>

<ul class="opts" aria-label="Antworten">
  {#each block.options as o, i (o.id)}
    <li class="opt" class:ok={o.correct}>
      <button class="mark" aria-pressed={o.correct} aria-label="Antwort {i + 1} als richtig markieren"
        title={o.correct ? 'Richtige Antwort – zum Ändern klicken' : 'Als richtige Antwort markieren'}
        onclick={() => (o.correct = !o.correct)}>{o.correct ? '✓' : ''}</button>
      <div class="body">
        {#if o.img}<img class="oimg" src={o.img} alt="" />{/if}
        <Inline multiline noNewline bind:value={o.text} placeholder="Antwort {i + 1}" autofocus={o.id === newId} />
      </div>
      <span class="tools">
        <ImgField bind:value={o.img} label="Bild" compact />
        <button class="x" aria-label="Antwort {i + 1} löschen" title="Antwort löschen" disabled={block.options.length <= 2}
          onclick={() => block.options.splice(i, 1)}>✕</button>
      </span>
    </li>
  {/each}
</ul>
<button class="addrow" onclick={add}>+ Antwort hinzufügen</button>
<p class="legend">Ein Klick auf den Kreis markiert die richtige Antwort. Es dürfen mehrere richtig sein.</p>

<style>
  .opts { list-style: none; margin: .5rem 0 0; padding: 0; display: grid; gap: .5rem; }
  .opt { display: flex; align-items: center; gap: .75rem; padding: .55rem .85rem; border: 2px solid var(--line); border-radius: var(--radius); background: var(--paper); }
  .opt.ok { border-color: var(--good); background: var(--good-wash); }
  .mark { flex: none; width: 1.9rem; height: 1.9rem; border-radius: 50%; border: 2px solid var(--muted); background: var(--paper); color: #fff; font-weight: 700; cursor: pointer; padding: 0; }
  .mark[aria-pressed='true'] { background: var(--good); border-color: var(--good); }
  .mark:hover { border-color: var(--good); }
  .body { flex: 1; display: flex; align-items: center; gap: .75rem; min-width: 0; flex-wrap: wrap; }
  .oimg { max-height: 6rem; max-width: 12rem; object-fit: contain; border-radius: 4px; background: #fff; }
  .tools { display: flex; align-items: center; gap: .3rem; opacity: 0; transition: opacity .12s; }
  .opt:hover .tools, .opt:focus-within .tools { opacity: 1; }
  @media (hover: none) { .tools { opacity: 1; } }
  .x { background: none; border: 0; color: var(--muted); cursor: pointer; padding: .3rem .5rem; border-radius: 6px; }
  .x:hover:not(:disabled) { background: var(--bad-wash); color: var(--bad); }
  .x:disabled { opacity: .3; cursor: default; }
  .addrow { margin-top: .5rem; width: 100%; padding: .55rem; border: 2px dashed var(--line); background: none; border-radius: var(--radius); color: var(--muted); cursor: pointer; font-size: 1rem; }
  .addrow:hover { border-color: var(--accent); color: var(--accent); }
  .legend { margin: .5rem 0 0; font-size: .85rem; color: var(--muted); }
</style>
