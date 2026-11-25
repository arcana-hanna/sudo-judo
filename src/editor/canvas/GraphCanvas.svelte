<script lang="ts">
  import { uid, type GraphBlock } from '../../shared/types';
  import GraphBoard from '../../shared/ui/GraphBoard.svelte';
  import AnswerTabs from '../AnswerTabs.svelte';
  import Steps from '../ui/Steps.svelte';
  import Stepper from '../ui/Stepper.svelte';
  import Seg from '../ui/Seg.svelte';
  import ToolBar from '../ui/ToolBar.svelte';
  import { nextLabel, solveColoring } from '../../shared/graph';
  import { NODE_COLOR_NAMES } from '../../shared/palette';
  let { block = $bindable() }: { block: GraphBlock } = $props();

  type Tool = 'move' | 'node' | 'edge' | 'label' | 'delete';
  let step = $state<'build' | 'solve'>('build');
  let tool = $state<Tool>('move');
  let pending = $state('');
  let focus = $state('');
  let cur = $state(0);

  const tools: [Tool, string][] = [['move', 'Verschieben'], ['node', 'Knoten setzen'], ['edge', 'Kante ziehen'], ['label', 'Beschriften'], ['delete', 'Löschen']];
  const hintText: Record<Tool, string> = {
    move: 'Ziehe Knoten an eine neue Stelle.',
    node: 'Klicke auf eine freie Stelle, um einen Knoten zu setzen.',
    edge: 'Klicke nacheinander zwei Knoten an, um sie zu verbinden (bei Pfeilen: von … nach …).',
    label: 'Klicke einen Knoten oder eine Kante an, um sie zu beschriften.',
    delete: 'Klicke einen Knoten oder eine Kante an, um sie zu löschen.',
  };
  const setTool = (t: Tool) => { tool = t; pending = ''; focus = ''; };

  const sets = $derived([block.target, ...(block.alts ?? [])]);
  const answer = $derived(sets[Math.min(cur, sets.length - 1)]);
  const addAlt = () => { block.alts = [...(block.alts ?? []), [...answer]]; cur = block.alts.length; };
  const delAlt = () => { if (cur > 0) { block.alts!.splice(cur - 1, 1); cur = 0; } };

  function setMode(m: GraphBlock['mode']) {
    block.mode = m; block.target = []; block.alts = []; cur = 0;
    if (m === 'color') block.nodes.forEach((n) => (n.color = undefined));
  }
  const flip = (id: string) => { const i = answer.indexOf(id); if (i >= 0) answer.splice(i, 1); else answer.push(id); };
  function prune() {
    const valid = new Set([...block.nodes.map((n) => n.id), ...block.edges.map((e) => e.id)]);
    block.target = block.target.filter((t) => valid.has(t));
    block.alts = (block.alts ?? []).map((a) => a.filter((t) => valid.has(t)));
  }

  function onbg(x: number, y: number) {
    if (tool !== 'node' || block.nodes.length >= 20) return;
    block.nodes.push({ id: uid(), x: Math.round(x), y: Math.round(y), label: nextLabel(block.nodes) });
  }
  function nodeBuild(id: string) {
    if (tool === 'edge') {
      if (!pending) { pending = id; return; }
      const dup = block.edges.some((e) => block.directed ? e.a === pending && e.b === id : (e.a === pending && e.b === id) || (e.a === id && e.b === pending));
      if (pending !== id && !dup) block.edges.push({ id: uid(), a: pending, b: id });
      pending = '';
    } else if (tool === 'delete') {
      block.nodes.splice(block.nodes.findIndex((n) => n.id === id), 1);
      block.edges = block.edges.filter((e) => e.a !== id && e.b !== id);
      prune();
    } else if (tool === 'label') focus = id;
  }
  function edgeBuild(id: string) {
    if (tool === 'delete') { block.edges.splice(block.edges.findIndex((e) => e.id === id), 1); prune(); }
    else if (tool === 'label') focus = id;
  }
  const nodeSolve = (id: string) => { if (block.mode === 'nodes') flip(id); };
  const edgeSolve = (id: string) => { if (block.mode === 'edges') flip(id); };
  function onmovenode(id: string, x: number, y: number) {
    const n = block.nodes.find((n) => n.id === id);
    if (n) { n.x = Math.round(x); n.y = Math.round(y); }
  }

  const fNode = $derived(block.nodes.find((n) => n.id === focus));
  const fEdge = $derived(block.edges.find((e) => e.id === focus));
  const nodeName = (id: string) => block.nodes.find((n) => n.id === id)?.label ?? '?';
  const colorable = $derived(block.mode !== 'color' || solveColoring(block.nodes, block.edges, block.colors) !== null);
</script>

<div class="task">
  <span class="lab">Die Schüler sollen</span>
  <Seg label="Aufgabenart" value={block.mode} onchange={setMode}
    options={[{ value: 'nodes', label: 'Knoten markieren' }, { value: 'edges', label: 'Kanten markieren' }, { value: 'color', label: 'Knoten färben' }]} />
  {#if block.mode === 'color'}<Stepper label="Farben" value={block.colors} min={2} max={4} onchange={(v) => (block.colors = v)} />{/if}
  <label class="chk"><input type="checkbox" checked={!!block.directed} onchange={(e) => (block.directed = e.currentTarget.checked)} /> Kanten mit Pfeil</label>
</div>

<Steps bind:step />

{#if step === 'build'}
  <ToolBar tools={tools.map(([id, label]) => ({ id, label }))} value={tool} onchange={setTool} />
  <p class="cap">{hintText[tool]}</p>
  <GraphBoard nodes={block.nodes} edges={block.edges} directed={block.directed} {pending} focusId={tool === 'label' ? focus : ''}
    draggable={tool === 'move'} label="Zeichnung" {onbg} onnode={nodeBuild} onedge={edgeBuild} {onmovenode} />

  {#if tool === 'label'}
    <div class="panel">
      {#if fNode}
        <label>Knoten <input maxlength="6" value={fNode.label} oninput={(e) => (fNode.label = e.currentTarget.value)} aria-label="Name des Knotens" /></label>
        <label>Form
          <select value={fNode.shape ?? 'circle'} onchange={(e) => (fNode.shape = e.currentTarget.value as 'circle' | 'square' | 'diamond')}>
            <option value="circle">Kreis</option><option value="square">Quadrat</option><option value="diamond">Raute</option>
          </select></label>
        {#if block.mode !== 'color'}
          <label>Farbe
            <select value={fNode.color ?? 0} onchange={(e) => (fNode.color = +e.currentTarget.value || undefined)}>
              {#each NODE_COLOR_NAMES as cn, i}<option value={i}>{i === 0 ? 'keine' : cn}</option>{/each}
            </select></label>
        {/if}
      {:else if fEdge}
        <label>Kante {nodeName(fEdge.a)}{block.directed ? ' → ' : '–'}{nodeName(fEdge.b)}
          <input maxlength="8" value={fEdge.w ?? ''} oninput={(e) => (fEdge.w = e.currentTarget.value || undefined)} placeholder="z. B. 5" aria-label="Beschriftung oder Gewicht" /></label>
        {#if block.directed}<button class="small" onclick={() => { [fEdge.a, fEdge.b] = [fEdge.b, fEdge.a]; }}>Richtung umkehren</button>{/if}
      {:else}
        <small>Noch nichts gewählt.</small>
      {/if}
    </div>
  {/if}
  {#if !colorable}<p class="warn">Dieser Graph lässt sich mit {block.colors} Farben nicht färben – die Aufgabe wäre unlösbar.</p>{/if}
{:else if block.mode === 'color'}
  <p class="cap">Beim Färben prüft der Computer jede gültige Färbung (Nachbarn verschieden, höchstens {block.colors} Farben). Du musst keine Lösung markieren.</p>
  <GraphBoard nodes={block.nodes} edges={block.edges} directed={block.directed} disabled label="Zeichnung" />
  {#if colorable}<p class="okmsg">✓ Mit {block.colors} Farben lösbar.</p>{:else}<p class="warn">Mit {block.colors} Farben nicht lösbar.</p>{/if}
{:else}
  <p class="cap">Klicke die {block.mode === 'nodes' ? 'Knoten' : 'Kanten'} an, die richtig sind – so wie es ein Schüler tun würde. Das ist die Lösung. Mehrere richtige Lösungen sind möglich.</p>
  <AnswerTabs count={sets.length} bind:cur onadd={addAlt} ondel={delAlt} />
  <GraphBoard nodes={block.nodes} edges={block.edges} directed={block.directed}
    selectedNodes={block.mode === 'nodes' ? answer : []} selectedEdges={block.mode === 'edges' ? answer : []}
    label="Lösung {cur + 1}" onnode={nodeSolve} onedge={edgeSolve} />
{/if}

<style>
  .task { display: flex; gap: .9rem; align-items: center; flex-wrap: wrap; margin-bottom: .2rem; }
  .lab { color: var(--muted); font-size: .9rem; }
  .chk { display: inline-flex; gap: .3rem; align-items: center; font-size: .92rem; }
  .tools { display: flex; gap: .4rem; flex-wrap: wrap; margin-bottom: .4rem; }
  .cap { margin: .2rem 0 .6rem; font-size: .9rem; color: var(--muted); }
  .panel { display: flex; gap: .8rem; align-items: center; flex-wrap: wrap; margin-top: .6rem; padding: .5rem .7rem; background: var(--wash); border-radius: var(--radius); }
  .panel label { display: inline-flex; gap: .35rem; align-items: center; font-size: .9rem; }
  .panel input { width: 6rem; padding: .35rem .5rem; border: 2px solid var(--line); border-radius: var(--radius); }
  .panel select { padding: .35rem; border: 2px solid var(--line); border-radius: var(--radius); background: var(--paper); }
  small { color: var(--muted); }
  .warn { color: var(--bad); margin: .4rem 0 0; font-size: .9rem; }
  .okmsg { color: var(--good); margin: .4rem 0 0; font-size: .9rem; font-weight: 650; }
</style>
