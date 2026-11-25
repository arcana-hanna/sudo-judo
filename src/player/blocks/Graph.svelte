<script lang="ts">
  import { str } from '../../shared/theme.svelte';
  import type { GraphBlock } from '../../shared/types';
  import GraphBoard from '../../shared/ui/GraphBoard.svelte';
  import { solveColoring } from '../../shared/graph';
  import { sameSet } from '../../shared/order';
  import { NODE_FILL, NODE_COLOR_NAMES } from '../../shared/palette';
  let { block, solved = false, onsolved }:
    { block: GraphBlock; solved?: boolean; onsolved?: () => void } = $props();

  let selN = $state<string[]>([]);
  let selE = $state<string[]>([]);
  let col = $state<Record<string, number>>({});
  let result = $state<'idle' | 'ok' | 'no'>('idle');

  $effect(() => {
    if (!solved) return;
    if (block.mode === 'nodes') selN = [...block.target];
    else if (block.mode === 'edges') selE = [...block.target];
    else col = solveColoring(block.nodes, block.edges, block.colors) ?? col;
    result = 'ok';
  });

  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  function onnode(id: string) {
    if (solved) return;
    result = 'idle';
    if (block.mode === 'nodes') selN = toggle(selN, id);
    else if (block.mode === 'color') col[id] = ((col[id] ?? 0) + 1) % (block.colors + 1);
  }
  function onedge(id: string) {
    if (solved || block.mode !== 'edges') return;
    result = 'idle'; selE = toggle(selE, id);
  }
  function check() {
    const answers = [block.target, ...(block.alts ?? [])];
    const ok = block.mode === 'nodes' ? answers.some((a) => sameSet(selN, a))
      : block.mode === 'edges' ? answers.some((a) => sameSet(selE, a))
      : block.nodes.every((n) => (col[n.id] ?? 0) > 0) && block.edges.every((e) => col[e.a] !== col[e.b]);
    result = ok ? 'ok' : 'no';
    if (ok) onsolved?.();
  }
  const note = $derived(
    block.mode === 'nodes' ? 'Klicke auf die passenden Knoten.'
    : block.mode === 'edges' ? 'Klicke auf die passenden Kanten.'
    : `Klicke einen Knoten, um ihn zu färben. Du hast ${block.colors} Farben.`);
</script>

<fieldset class="ex" class:solved>
  <legend>{block.question}</legend>
  {#if !solved}<p class="note">{note}</p>{/if}
  {#if block.mode === 'color'}
    <ul class="legend" aria-label="Verfügbare Farben">
      {#each Array.from({ length: block.colors }, (_, i) => i + 1) as c}
        <li><span class="sw" style="background:{NODE_FILL[c]}"></span>{NODE_COLOR_NAMES[c]}</li>
      {/each}
    </ul>
  {/if}
  <GraphBoard nodes={block.nodes} edges={block.edges} directed={block.directed} selectedNodes={selN} selectedEdges={selE} nodeColors={col}
    disabled={solved} {onnode} {onedge} label={block.question} />
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
  .ex { border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem 1.25rem 1.25rem; margin: 0 0 1.5rem; }
  .ex.solved { border-color: var(--good); }
  legend { font-weight: 650; font-size: 1.15rem; padding: 0 .5rem; margin-left: -.5rem; max-width: 60ch; }
  .note { color: var(--muted); margin: 0 0 .75rem; font-size: .95rem; }
  .legend { list-style: none; display: flex; gap: 1rem; padding: 0; margin: 0 0 .75rem; font-size: .95rem; }
  .sw { display: inline-block; width: 1rem; height: 1rem; border: 2px solid var(--ink); border-radius: 50%; margin-right: .35rem; vertical-align: -.15rem; }
  .row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
  .check { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: var(--btn-radius); padding: .6rem 1.4rem; font-weight: 650; cursor: pointer; }
  .check:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .msg { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
  .ok { color: var(--good); font-weight: 650; }
  .no { color: var(--bad); font-weight: 650; }
</style>
