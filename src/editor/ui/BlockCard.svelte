<script lang="ts">
  import { editorBlocks } from '../registry';
  import { playerBlocks } from '../../player/registry';
  import QuestionField from './QuestionField.svelte';
  import TipField from './TipField.svelte';
  import LevelField from './LevelField.svelte';

  let { block = $bindable(), index, count, issues = [], onmove, ondup, ondelete, ongrab, ongrabend }:
    { block: any; index: number; count: number; issues?: string[];
      onmove: (dir: -1 | 1) => void; ondup: () => void; ondelete: () => void; ongrab?: () => void; ongrabend?: () => void } = $props();

  const def = $derived(editorBlocks[block.type]);
  const pdef = $derived(playerBlocks[block.type]);
  const isExercise = $derived(!!pdef?.exercise);
  const hasQuestion = $derived('question' in block);
  const hasHint = $derived('hint' in block);
  let testing = $state(false);
  let solved = $state(false);
  let el: HTMLElement | undefined = $state();

  function grab(e: DragEvent) {
    e.dataTransfer?.setData('text/plain', 'block');
    if (el) e.dataTransfer?.setDragImage(el, 20, 20);
    ongrab?.();
  }
  const toggleTest = () => { testing = !testing; solved = false; };
</script>

<article class="block" class:testing bind:this={el} tabindex="-1" id="blk-{block.id}" data-type={block.type}>
  <div class="kind" aria-hidden="true">{def?.label ?? block.type}</div>
  <div class="bar" role="toolbar" aria-label="{def?.label ?? 'Block'} bearbeiten">
    <span class="grip" draggable="true" role="presentation" title="Zum Verschieben ziehen" ondragstart={grab} ondragend={ongrabend}>⠿</span>
    <strong class="name">{def?.label ?? block.type}</strong>
    {#if isExercise}
      <button class="try" class:on={testing} aria-pressed={testing} onclick={toggleTest}>{testing ? '✎ Weiter bearbeiten' : '▶ Ausprobieren'}</button>
    {/if}
    <button class="ib" onclick={() => onmove(-1)} disabled={index === 0} aria-label="Block nach oben" title="Nach oben">↑</button>
    <button class="ib" onclick={() => onmove(1)} disabled={index === count - 1} aria-label="Block nach unten" title="Nach unten">↓</button>
    <button class="ib" onclick={ondup} aria-label="Block duplizieren" title="Duplizieren">⧉</button>
    <button class="ib del" onclick={ondelete} aria-label="Block löschen" title="Löschen">🗑</button>
  </div>

  {#if testing && pdef}
    <div class="testing-note">So sehen es die Schüler – probiere es aus. Nichts wird gespeichert.</div>
    <pdef.component {block} {solved} onsolved={() => (solved = true)} />
  {:else}
    {#if hasQuestion}<QuestionField bind:value={block.question} />{/if}
    {#if def}
      <div class="content" class:formed={def.formLike}>
        <def.component bind:block />
      </div>
    {:else}
      <p>Unbekannter Blocktyp „{block.type}“ (bleibt beim Export erhalten).</p>
    {/if}
    {#if issues.length}
      <ul class="hints" role="status" aria-label="Hinweise zu dieser Aufgabe">
        {#each issues as m (m)}<li>{m}</li>{/each}
      </ul>
    {/if}
    {#if hasHint}<div class="foot"><TipField bind:value={block.hint} /><LevelField bind:value={block.level} /></div>{/if}
  {/if}
</article>

<style>
  .block { position: relative; margin: 0; padding: .9rem 1rem 1rem; border: 1px solid transparent; border-radius: 10px; outline: none; transition: border-color .12s, background .12s; }
  .block:hover, .block:focus-within { border-color: var(--line); background: color-mix(in srgb, var(--accent) 3%, var(--paper)); }
  .block.testing { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--paper)); }
  .kind { position: absolute; top: -.7rem; left: .8rem; padding: 0 .4rem; background: var(--paper); color: var(--muted); font-size: .72rem; letter-spacing: .06em; text-transform: uppercase; opacity: 0; transition: opacity .12s; }
  .bar { position: absolute; top: -1.15rem; right: .6rem; z-index: 5; display: flex; align-items: center; gap: .15rem; padding: .15rem .3rem; background: var(--paper);
         border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 2px 10px rgba(28, 43, 51, .12); font-size: .85rem; opacity: 0; pointer-events: none; transition: opacity .12s; }
  .block:hover .bar, .block:focus-within .bar { opacity: 1; pointer-events: auto; }
  .block:hover .kind, .block:focus-within .kind { opacity: 0; }
  @media (hover: none) {
    .bar { position: static; opacity: 1; pointer-events: auto; margin: 0 0 .4rem; justify-content: flex-end; box-shadow: none; border-color: transparent; background: transparent; }
    .kind { display: none; }
  }
  .name { padding: 0 .4rem; color: var(--muted); font-weight: 600; white-space: nowrap; }
  .grip { cursor: grab; padding: .2rem .35rem; color: var(--muted); user-select: none; touch-action: none; }
  .ib, .try { border: 0 !important; background: none !important; padding: .3rem .55rem !important; border-radius: 6px; cursor: pointer; font-weight: 600 !important; font-size: .85rem; color: var(--ink); }
  .ib:hover:not(:disabled), .try:hover { background: var(--wash) !important; }
  .try { color: var(--accent); } .try.on { background: var(--accent) !important; color: var(--accent-ink); }
  .ib:disabled { opacity: .3; }
  .ib.del:hover:not(:disabled) { background: var(--bad-wash) !important; }
  .content { margin-top: .4rem; }
  .testing-note { margin: .2rem 0 .8rem; font-size: .85rem; color: var(--accent); font-weight: 600; }
  .hints { list-style: none; margin: .8rem 0 0; padding: .5rem .8rem; background: var(--bad-wash); border-left: 4px solid var(--bad); border-radius: 4px; color: var(--bad); font-size: .92rem; display: grid; gap: .15rem; }
</style>
