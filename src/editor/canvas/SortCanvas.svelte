<script lang="ts">
  import { uid, type SortBlock } from '../../shared/types';
  import Inline from '../ui/Inline.svelte';
  import ImgField from '../ImgField.svelte';
  let { block = $bindable() }: { block: SortBlock } = $props();

  let dragId = $state('');
  let overCat = $state('');
  let newId = $state('');

  function addItem(cat: string) { const it = { id: uid(), text: '', cat }; block.items.push(it); newId = it.id; }
  const addCat = () => block.categories.push({ id: uid(), text: '' });
  function removeCat(i: number) {
    const [gone] = block.categories.splice(i, 1);
    const to = block.categories[0]?.id ?? '';
    for (const it of block.items) if (it.cat === gone.id) it.cat = to;
  }
  function moveTo(id: string, cat: string) { const it = block.items.find((x) => x.id === id); if (it) it.cat = cat; }
  function shift(id: string, d: -1 | 1) {                           // Karte in die Nachbargruppe legen
    const it = block.items.find((x) => x.id === id)!;
    const i = block.categories.findIndex((c) => c.id === it.cat);
    const j = Math.min(block.categories.length - 1, Math.max(0, i + d));
    it.cat = block.categories[j].id;
  }
  function key(e: KeyboardEvent, id: string) {                      // Alt + Pfeil links/rechts
    if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault(); shift(id, e.key === 'ArrowRight' ? 1 : -1);
  }
</script>

<p class="note">Lege jede Karte in die richtige Gruppe – das ist die Lösung. Die Schüler sehen sie gemischt. (Ziehen am Griff ⠿, die Pfeile ◀ ▶ an der Karte oder Alt + ← →)</p>

<div class="cats">
  {#each block.categories as c, ci (c.id)}
    <section class="cat" class:over={overCat === c.id}
      ondragover={(e) => { if (dragId) { e.preventDefault(); overCat = c.id; } }} ondragleave={() => (overCat = '')}
      ondrop={(e) => { if (!dragId) return; e.preventDefault(); moveTo(dragId, c.id); dragId = ''; overCat = ''; }}>
      <header>
        <Inline bind:value={c.text} cls="ctitle" placeholder="Gruppe {ci + 1}" label="Name der Gruppe {ci + 1}" />
        <button class="x" onclick={() => removeCat(ci)} disabled={block.categories.length <= 2} aria-label="Gruppe {ci + 1} löschen">✕</button>
      </header>
      <div class="cards">
        {#each block.items as it, k (it.id)}
          {#if it.cat === c.id}
            <span class="chip">
              <span class="grip" draggable="true" role="presentation" title="Ziehen, um die Karte in eine andere Gruppe zu legen"
                ondragstart={(e) => { dragId = it.id; e.dataTransfer?.setData('text/plain', it.id); }} ondragend={() => { dragId = ''; overCat = ''; }}>⠿</span>
              {#if it.img}<img src={it.img} alt="" />{/if}
              <Inline fit={4} bind:value={it.text} placeholder="Karte" label="Karte {k + 1}" autofocus={it.id === newId} onkeydown={(e) => key(e, it.id)} />
              <span class="tools">
                <button class="x" onclick={() => shift(it.id, -1)} disabled={ci === 0} aria-label="Karte {k + 1} in die vorherige Gruppe" title="In die vorherige Gruppe">◀</button>
                <button class="x" onclick={() => shift(it.id, 1)} disabled={ci === block.categories.length - 1} aria-label="Karte {k + 1} in die nächste Gruppe" title="In die nächste Gruppe">▶</button>
                <ImgField bind:value={it.img} label="Bild" compact />
                <button class="x" onclick={() => block.items.splice(k, 1)} aria-label="Karte {k + 1} löschen">✕</button>
              </span>
            </span>
          {/if}
        {/each}
      </div>
      <button class="add" onclick={() => addItem(c.id)}>+ Karte</button>
    </section>
  {/each}
  {#if block.categories.length < 6}<button class="newcat" onclick={addCat}>+ Gruppe</button>{/if}
</div>

<style>
  .note { margin: .4rem 0 .6rem; font-size: .9rem; color: var(--muted); }
  .cats { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: .75rem; align-items: start; }
  .cat { border: 2px solid var(--line); border-radius: var(--radius); padding: .5rem .7rem .7rem; background: var(--paper); min-height: 7rem; }
  .cat.over { border-color: var(--accent); background: var(--wash); }
  header { display: flex; align-items: center; gap: .3rem; }
  .cards { display: flex; flex-wrap: wrap; gap: .4rem; margin: .4rem 0; min-height: 2.2rem; }
  .chip { position: relative; display: inline-flex; align-items: center; gap: .3rem; padding: .2rem .5rem; border: 2px solid var(--line); border-radius: var(--radius); background: var(--paper); max-width: 100%; }
  .chip img { height: 2.2rem; width: auto; max-width: 4rem; object-fit: contain; }
  .chip :global(.inl) { width: auto; min-width: 4rem; field-sizing: content; }
  .tools { position: absolute; top: -2rem; left: 0; z-index: 4; display: inline-flex; gap: .2rem; align-items: center; padding: .15rem .3rem; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 2px 10px rgba(28, 43, 51, .15); opacity: 0; pointer-events: none; transition: opacity .12s; white-space: nowrap; }
  .chip:hover .tools, .chip:focus-within .tools { opacity: 1; pointer-events: auto; }
  @media (hover: none) { .tools { position: static; opacity: 1; pointer-events: auto; box-shadow: none; border: 0; padding: 0; } }
  .grip { cursor: grab; color: var(--muted); user-select: none; touch-action: none; }
  .x { background: none; border: 0; color: var(--muted); cursor: pointer; padding: .2rem .4rem; border-radius: 6px; }
  .x:hover:not(:disabled) { background: var(--bad-wash); color: var(--bad); } .x:disabled { opacity: .3; cursor: default; }
  .add { border: 0; background: none; color: var(--accent); cursor: pointer; padding: .2rem 0; text-decoration: underline; text-underline-offset: 3px; }
  .newcat { border: 2px dashed var(--line); background: none; border-radius: var(--radius); color: var(--muted); cursor: pointer; min-height: 7rem; font-size: 1rem; }
  .newcat:hover { border-color: var(--accent); color: var(--accent); }
</style>
