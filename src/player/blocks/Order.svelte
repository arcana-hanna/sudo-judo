<script lang="ts">
  import { str } from '../../shared/theme.svelte';
  import { untrack } from 'svelte';
  import type { OrderBlock } from '../../shared/types';
  import { seededShuffle } from '../../shared/shuffle';
  import { oneValidOrder, satisfies } from '../../shared/order';
  let { block, solved = false, onsolved }:
    { block: OrderBlock; solved?: boolean; onsolved?: () => void } = $props();

  const item = (id: string) => block.items.find((i) => i.id === id)!;
  const key = (i: { text: string; img?: string }) => i.text + '\u0001' + (i.img ?? '');
  const rulesMode = $derived(block.mode === 'rules');
  // 'fixed': genau die eingetragene Reihenfolge (gleiche Karten sind austauschbar); 'rules': jede Reihenfolge, die alle Regeln erfüllt
  const isCorrect = (ids: string[]) => rulesMode
    ? satisfies(ids, block.rules ?? [])
    : ids.map((id) => key(item(id))).join('\u0000') === block.items.map(key).join('\u0000');

  function shuffled(): string[] {
    const ids = seededShuffle(block.items.map((i) => i.id), block.id);
    for (let t = 0; t < ids.length && ids.length > 1 && isCorrect(ids); t++) ids.push(ids.shift()!);
    return ids;
  }

  let order = $state<string[]>(untrack(shuffled));
  let result = $state<'idle' | 'ok' | 'no'>('idle');
  let dragFrom = $state(-1);
  let over = $state(-1);

  $effect(() => {
    if (!solved) return;
    const ids = block.items.map((i) => i.id);
    order = rulesMode ? (oneValidOrder(ids, block.rules ?? []) ?? ids) : ids;
    result = 'ok';
  });

  const label = (id: string) => item(id).text || 'Bild';
  function move(from: number, to: number) {
    if (solved || from === to || to < 0 || to >= order.length) return;
    const next = [...order];
    next.splice(to, 0, next.splice(from, 1)[0]);
    order = next; result = 'idle';
  }
  function check() {
    const ok = isCorrect(order);
    result = ok ? 'ok' : 'no';
    if (ok) onsolved?.();
  }
</script>

<fieldset class="ord" class:solved>
  <legend>{block.question}</legend>
  <p class="note">{solved ? '' : 'Ziehe die Karten in die richtige Reihenfolge.'}</p>
  <ol>
    {#each order as id, i (id)}
      <li class="item" class:over={over === i && dragFrom !== i} class:dragging={dragFrom === i}
        draggable={!solved}
        ondragstart={(e) => { dragFrom = i; e.dataTransfer?.setData('text/plain', String(i)); }}
        ondragover={(e) => { e.preventDefault(); over = i; }}
        ondragend={() => { dragFrom = -1; over = -1; }}
        ondrop={(e) => { e.preventDefault(); move(dragFrom, i); dragFrom = -1; over = -1; }}>
        <span class="grip" aria-hidden="true">⠿</span>
        {#if item(id).img}<img class="pic" src={item(id).img} alt="" />{/if}
        <span class="txt">{item(id).text}</span>
        <button class="mv" disabled={solved || i === 0} onclick={() => move(i, i - 1)}
          aria-label="Nach oben: {label(id)}">↑</button>
        <button class="mv" disabled={solved || i === order.length - 1} onclick={() => move(i, i + 1)}
          aria-label="Nach unten: {label(id)}">↓</button>
      </li>
    {/each}
  </ol>
  <div class="row">
    <button class="check" onclick={check} disabled={solved}>Prüfen</button>
    <p class="msg" role="status">
      {#if result === 'ok'}<span class="ok">{str().ok}</span>
      {:else if result === 'no'}<span class="no">{str().no}</span>
        {#if block.hint}<span>{str().tip} {block.hint}</span>{/if}
      {/if}
    </p>
  </div>
</fieldset>

<style>
  .ord { border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem 1.25rem 1.25rem; margin: 0 0 1.5rem; }
  .ord.solved { border-color: var(--good); }
  legend { font-weight: 650; font-size: 1.15rem; padding: 0 .5rem; margin-left: -.5rem; max-width: 60ch; }
  .note { color: var(--muted); margin: 0 0 .5rem; font-size: .95rem; min-height: 1.4em; }
  ol { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
  .item { display: flex; align-items: center; gap: .6rem; padding: .6rem .75rem; background: var(--paper);
          border: 2px solid var(--line); border-radius: var(--radius); cursor: grab; }
  .solved .item { cursor: default; }
  .item.over { border-color: var(--accent); background: var(--wash); }
  .item.dragging { opacity: .45; }
  .grip { color: var(--muted); }
  .pic { height: 3.2rem; width: auto; max-width: 8rem; object-fit: contain; }
  .txt { flex: 1; }
  .mv { border: 2px solid var(--line); background: var(--paper); border-radius: var(--radius); width: 2rem; height: 2rem; cursor: pointer; padding: 0; }
  .mv:hover:not(:disabled) { border-color: var(--accent); }
  .mv:disabled { opacity: .3; cursor: default; }
  .row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
  .check { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: var(--btn-radius); padding: .6rem 1.4rem; font-weight: 650; cursor: pointer; }
  .check:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .msg { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
  .ok { color: var(--good); font-weight: 650; }
  .no { color: var(--bad); font-weight: 650; }
</style>
