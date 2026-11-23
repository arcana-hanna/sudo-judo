<script lang="ts">
  import { uid, type OrderBlock } from '../../shared/types';
  import Inline from '../ui/Inline.svelte';
  import ImgField from '../ImgField.svelte';
  import OrderRules from './OrderRules.svelte';
  let { block = $bindable() }: { block: OrderBlock } = $props();

  const rules = $derived(block.mode === 'rules');
  let dragFrom = $state(-1);
  let over = $state(-1);
  let newId = $state('');

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= block.items.length) return;
    block.items.splice(to, 0, block.items.splice(from, 1)[0]);
  }
  function remove(i: number) {
    const [gone] = block.items.splice(i, 1);
    if (block.rules) block.rules = block.rules.filter((r) => r.a !== gone.id && r.b !== gone.id);
  }
  function add() { const it = { id: uid(), text: '' }; block.items.push(it); newId = it.id; }
  function grab(e: DragEvent, i: number) {
    dragFrom = i;
    e.dataTransfer?.setData('text/plain', String(i));
    const li = (e.currentTarget as HTMLElement).closest('li');
    if (li) e.dataTransfer?.setDragImage(li, 12, 12);
  }
</script>

<p class="note">{rules
  ? 'Die Reihenfolge hier ist egal – unten legst du die Regeln fest. Die Schüler sehen die Karten gemischt.'
  : 'So ist es richtig – die Schüler sehen die Karten gemischt. Zum Ändern am Griff ziehen.'}</p>

<ol class="list" aria-label="Karten in der richtigen Reihenfolge">
  {#each block.items as it, i (it.id)}
    <li class="item" class:over={over === i && dragFrom !== i} class:dragging={dragFrom === i}
      ondragover={(e) => { if (dragFrom >= 0) { e.preventDefault(); over = i; } }}
      ondrop={(e) => { if (dragFrom < 0) return; e.preventDefault(); move(dragFrom, i); dragFrom = -1; over = -1; }}>
      <span class="grip" draggable="true" role="presentation" title="Zum Verschieben ziehen"
        ondragstart={(e) => grab(e, i)} ondragend={() => { dragFrom = -1; over = -1; }}>⠿</span>
      <span class="num">{i + 1}</span>
      {#if it.img}<img class="pic" src={it.img} alt="" />{/if}
      <Inline multiline noNewline bind:value={it.text} placeholder="Karte {i + 1}" autofocus={it.id === newId} />
      <span class="tools">
        <ImgField bind:value={it.img} label="Bild" compact />
        <button class="mv" onclick={() => move(i, i - 1)} disabled={i === 0} aria-label="Karte {i + 1} nach oben">↑</button>
        <button class="mv" onclick={() => move(i, i + 1)} disabled={i === block.items.length - 1} aria-label="Karte {i + 1} nach unten">↓</button>
        <button class="x" onclick={() => remove(i)} disabled={block.items.length <= 2} aria-label="Karte {i + 1} löschen">✕</button>
      </span>
    </li>
  {/each}
</ol>
<button class="addrow" onclick={add}>+ Karte hinzufügen</button>

<div class="adv"><OrderRules bind:block /></div>

<style>
  .note { margin: .4rem 0 .6rem; font-size: .9rem; color: var(--muted); }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
  .item { display: flex; align-items: center; gap: .6rem; padding: .5rem .75rem; background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius); }
  .item.over { border-color: var(--accent); background: var(--wash); }
  .item.dragging { opacity: .45; }
  .grip { cursor: grab; color: var(--muted); padding: 0 .2rem; user-select: none; touch-action: none; }
  .num { width: 1.4rem; text-align: right; color: var(--muted); font-size: .9rem; }
  .pic { height: 3rem; width: auto; max-width: 7rem; object-fit: contain; }
  .tools { display: flex; align-items: center; gap: .25rem; margin-left: auto; opacity: 0; transition: opacity .12s; }
  .item:hover .tools, .item:focus-within .tools { opacity: 1; }
  @media (hover: none) { .tools { opacity: 1; } }
  .mv, .x { background: none; border: 0; color: var(--muted); cursor: pointer; padding: .3rem .5rem; border-radius: 6px; }
  .mv:hover:not(:disabled) { background: var(--wash); color: var(--ink); } .x:hover:not(:disabled) { background: var(--bad-wash); color: var(--bad); }
  .mv:disabled, .x:disabled { opacity: .3; cursor: default; }
  .addrow { margin-top: .5rem; width: 100%; padding: .55rem; border: 2px dashed var(--line); background: none; border-radius: var(--radius); color: var(--muted); cursor: pointer; font-size: 1rem; }
  .addrow:hover { border-color: var(--accent); color: var(--accent); }
  .adv { margin-top: .9rem; padding-top: .7rem; border-top: 1px solid var(--line); }
</style>
