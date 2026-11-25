<script lang="ts">
  import { str } from '../../shared/theme.svelte';
  import { untrack } from 'svelte';
  import type { SortBlock } from '../../shared/types';
  import { seededShuffle } from '../../shared/shuffle';
  let { block, solved = false, onsolved }:
    { block: SortBlock; solved?: boolean; onsolved?: () => void } = $props();

  const order = untrack(() => seededShuffle(block.items.map((i) => i.id), block.id));
  let placed = $state<Record<string, string>>({}); // Karte -> Kategorie
  let sel = $state('');                             // gerade gewählte Karte
  let result = $state<'idle' | 'ok' | 'no'>('idle');
  let dragId = $state('');

  const item = (id: string) => block.items.find((i) => i.id === id)!;
  const pool = $derived(order.filter((id) => !placed[id]));
  const inCat = (cat: string) => order.filter((id) => placed[id] === cat);
  const allPlaced = $derived(pool.length === 0);

  $effect(() => {
    if (solved) { placed = Object.fromEntries(block.items.map((i) => [i.id, i.cat])); sel = ''; result = 'ok'; }
  });

  function put(id: string, cat: string) {
    if (solved || !id) return;
    if (cat) placed[id] = cat; else delete placed[id];
    sel = ''; result = 'idle';
  }
  function check() {
    const ok = block.items.every((i) => placed[i.id] === i.cat);
    result = ok ? 'ok' : 'no';
    if (ok) onsolved?.();
  }
</script>

{#snippet card(id: string, inPool: boolean)}
  <button class="chip" class:sel={sel === id} draggable={!solved} disabled={solved}
    ondragstart={() => (dragId = id)} ondragend={() => (dragId = '')}
    onclick={() => (inPool ? (sel = sel === id ? '' : id) : put(id, ''))}
    aria-label={inPool ? (item(id).text || 'Bildkarte') : `Zurücklegen: ${item(id).text || 'Bildkarte'}`}>
    {#if item(id).img}<img class="cimg" src={item(id).img} alt="" />{/if}{item(id).text}
  </button>
{/snippet}

<fieldset class="sort" class:solved>
  <legend>{block.question}</legend>
  {#if !solved}
    <p class="note">Wähle eine Karte und lege sie in eine Gruppe – oder ziehe sie dorthin.</p>
  {/if}

  <div class="pool" role="group" aria-label="Noch nicht zugeordnet"
    ondragover={(e) => e.preventDefault()} ondrop={(e) => { e.preventDefault(); put(dragId, ''); }}>
    {#each pool as id (id)}{@render card(id, true)}{/each}
    {#if pool.length === 0 && !solved}<span class="empty">Alle Karten sind zugeordnet.</span>{/if}
  </div>

  <div class="cats">
    {#each block.categories as c (c.id)}
      <section class="cat" ondragover={(e) => e.preventDefault()}
        ondrop={(e) => { e.preventDefault(); put(dragId, c.id); }}>
        <h3>{c.text}</h3>
        <div class="cards">{#each inCat(c.id) as id (id)}{@render card(id, false)}{/each}</div>
        {#if sel}<button class="drop" onclick={() => put(sel, c.id)}>Hierher legen</button>{/if}
      </section>
    {/each}
  </div>

  <div class="row">
    <button class="check" onclick={check} disabled={solved || !allPlaced}>Prüfen</button>
    <p class="msg" role="status">
      {#if result === 'ok'}<span class="ok">{str().ok}</span>
      {:else if result === 'no'}<span class="no">{str().no}</span>
        {#if block.hint}<span>{str().tip} {block.hint}</span>{/if}
      {/if}
    </p>
  </div>
</fieldset>

<style>
  .sort { border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem 1.25rem 1.25rem; margin: 0 0 1.5rem; }
  .sort.solved { border-color: var(--good); }
  legend { font-weight: 650; font-size: 1.15rem; padding: 0 .5rem; margin-left: -.5rem; max-width: 60ch; }
  .note { color: var(--muted); margin: 0 0 .75rem; font-size: .95rem; }
  .pool { display: flex; flex-wrap: wrap; gap: .5rem; min-height: 3.2rem; padding: .6rem; background: var(--wash); border-radius: var(--radius); }
  .empty { color: var(--muted); align-self: center; }
  .cats { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: .75rem; margin-top: .75rem; }
  .cat { border: 2px solid var(--line); border-radius: var(--radius); padding: .6rem .75rem .75rem; min-height: 7rem; }
  h3 { margin: 0 0 .5rem; font-size: 1rem; }
  .cards { display: flex; flex-wrap: wrap; gap: .4rem; min-height: 2rem; }
  .chip { padding: .45rem .8rem; background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius); cursor: grab; font-size: 1rem; }
  .chip:hover:not(:disabled) { border-color: var(--accent); }
  .chip.sel { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
  .cimg { height: 2.6rem; width: auto; max-width: 5rem; object-fit: contain; vertical-align: middle; margin-right: .3rem; }
  .chip:disabled { cursor: default; color: var(--ink); }
  .drop { margin-top: .6rem; width: 100%; padding: .4rem; border: 2px dashed var(--accent); background: var(--paper); color: var(--accent); border-radius: var(--radius); font-weight: 650; cursor: pointer; }
  .row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
  .check { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: var(--btn-radius); padding: .6rem 1.4rem; font-weight: 650; cursor: pointer; }
  .check:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .msg { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
  .ok { color: var(--good); font-weight: 650; }
  .no { color: var(--bad); font-weight: 650; }
</style>
