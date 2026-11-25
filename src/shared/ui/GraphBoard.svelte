<script lang="ts">
  import type { GraphEdge, GraphNode } from '../types';
  import { NODE_FILL, NODE_TEXT, NODE_COLOR_NAMES } from '../palette';

  let {
    nodes, edges, selectedNodes = [], selectedEdges = [], nodeColors = {}, pending = '', directed = false,
    draggable = false, disabled = false, label = 'Graph', focusId = '',
    onnode, onedge, onbg, onmovenode,
  }: {
    nodes: GraphNode[]; edges: GraphEdge[]; selectedNodes?: string[]; selectedEdges?: string[];
    nodeColors?: Record<string, number>; pending?: string; directed?: boolean; draggable?: boolean; disabled?: boolean;
    label?: string; focusId?: string;
    onnode?: (id: string) => void; onedge?: (id: string) => void;
    onbg?: (x: number, y: number) => void; onmovenode?: (id: string, x: number, y: number) => void;
  } = $props();

  const W = 600, H = 360, R = 24;
  const mid = Math.random().toString(36).slice(2, 8);        // eindeutige Marker-IDs je Zeichnung
  let svg: SVGSVGElement;
  let drag: { id: string; moved: boolean; sx: number; sy: number } | null = null;
  let suppressClick = false;

  const byId = (id: string) => nodes.find((n) => n.id === id)!;
  const clamp = (v: number, max: number) => Math.min(max - 24, Math.max(24, v));

  function geom(e: GraphEdge) {
    const a = byId(e.a), b = byId(e.b);
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const x1 = directed ? a.x + ux * R : a.x, y1 = directed ? a.y + uy * R : a.y;
    const x2 = directed ? b.x - ux * (R + 2) : b.x, y2 = directed ? b.y - uy * (R + 2) : b.y;
    return { x1, y1, x2, y2, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, a, b };
  }
  function toSvg(e: { clientX: number; clientY: number }) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }
  function nodeDown(e: PointerEvent, id: string) {
    if (disabled || !draggable) return;
    drag = { id, moved: false, sx: e.clientX, sy: e.clientY };
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
    drag.moved = true;
    const p = toSvg(e);
    onmovenode?.(drag.id, clamp(p.x, W), clamp(p.y, H));
  }
  function up() {
    if (drag?.moved) { suppressClick = true; setTimeout(() => (suppressClick = false), 50); }
    drag = null;
  }
  function nodeClick(e: Event, id: string) { e.stopPropagation(); if (disabled || suppressClick) return; onnode?.(id); }
  function edgeClick(e: Event, id: string) { e.stopPropagation(); if (!disabled) onedge?.(id); }
  function bgClick(e: MouseEvent) {
    if (disabled) return;
    const p = toSvg(e);
    onbg?.(clamp(p.x, W), clamp(p.y, H));
  }
  const keyActivate = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };
</script>

<svg bind:this={svg} viewBox="0 0 {W} {H}" role="group" aria-label={label}
  onpointermove={move} onpointerup={up} onpointerleave={up} onclick={bgClick}>
  <defs>
    <marker id="ah-{mid}" class="head" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="14" refX="14" refY="7" orient="auto">
      <path d="M0,0 L15,7 L0,14 z" /></marker>
    <marker id="ahs-{mid}" class="head sel" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="14" refX="14" refY="7" orient="auto">
      <path d="M0,0 L15,7 L0,14 z" /></marker>
  </defs>
  <rect class="bg" width={W} height={H} rx="6" />

  {#each edges as e (e.id)}
    {#if byId(e.a) && byId(e.b)}
      {@const g = geom(e)}
      {@const sel = selectedEdges.includes(e.id)}
      <g class="edge" class:sel class:live={!!onedge && !disabled} class:focus={focusId === e.id}
        role="button" tabindex={onedge && !disabled ? 0 : -1} aria-pressed={sel}
        aria-label="Kante {g.a.label}{directed ? ' nach ' : '–'}{g.b.label}{e.w ? ', ' + e.w : ''}"
        onclick={(ev) => edgeClick(ev, e.id)} onkeydown={keyActivate(() => onedge?.(e.id))}>
        <line class="hit" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />
        <line class="vis" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
          marker-end={directed ? `url(#${sel ? 'ahs' : 'ah'}-${mid})` : undefined} />
        {#if e.w}<text class="w" x={g.mx} y={g.my} dy=".35em" text-anchor="middle">{e.w}</text>{/if}
      </g>
    {/if}
  {/each}

  {#each nodes as n (n.id)}
    {@const c = nodeColors[n.id] ?? n.color ?? 0}
    {@const sel = selectedNodes.includes(n.id)}
    {@const fill = sel ? 'var(--accent)' : NODE_FILL[c]}
    <g class="node" class:sel class:pending={pending === n.id} class:drag={draggable && !disabled} class:focus={focusId === n.id}
      transform="translate({n.x} {n.y})" role="button" tabindex={disabled ? -1 : 0}
      aria-pressed={sel} aria-label="Knoten {n.label}{c ? ', ' + NODE_COLOR_NAMES[c] : ''}"
      onpointerdown={(ev) => nodeDown(ev, n.id)} onclick={(ev) => nodeClick(ev, n.id)}
      onkeydown={keyActivate(() => onnode?.(n.id))}>
      {#if n.shape === 'square'}<rect class="shape" x="-21" y="-21" width="42" height="42" rx="6" {fill} />
      {:else if n.shape === 'diamond'}<polygon class="shape" points="0,-27 27,0 0,27 -27,0" {fill} />
      {:else}<circle class="shape" r="22" {fill} />{/if}
      <text text-anchor="middle" dy=".35em" fill={sel ? 'var(--accent-ink)' : NODE_TEXT[c]} font-size={n.label.length > 3 ? 12 : 17}>{n.label}</text>
    </g>
  {/each}
</svg>

<style>
  svg { width: 100%; max-width: 600px; height: auto; display: block; touch-action: none; user-select: none; }
  .bg { fill: var(--wash); stroke: var(--line); stroke-width: 2; }
  .hit { stroke: transparent; stroke-width: 22; }
  .vis { stroke: var(--ink); stroke-width: 3; pointer-events: none; }
  .head path { fill: var(--ink); }
  .head.sel path { fill: var(--accent); }
  .edge.sel .vis { stroke: var(--accent); stroke-width: 7; }
  .edge.live { cursor: pointer; }
  .edge:focus, .node:focus { outline: none; }
  .edge:focus-visible .vis, .edge.focus .vis { stroke: var(--accent); stroke-width: 6; stroke-dasharray: 8 5; }
  .w { font: 700 15px var(--font); fill: var(--ink); paint-order: stroke; stroke: var(--wash); stroke-width: 6px; stroke-linejoin: round; pointer-events: none; }
  .node { cursor: pointer; outline: none; }
  .node.drag { cursor: grab; }
  .shape { stroke: var(--ink); stroke-width: 3; }
  .node.sel .shape { stroke-width: 5; }
  .node.pending .shape, .node.focus .shape { stroke: var(--accent); stroke-width: 6; stroke-dasharray: 6 4; }
  .node:focus-visible .shape { stroke: var(--accent); stroke-width: 6; }
  .node text { font-family: var(--font); font-weight: 700; pointer-events: none; }
</style>
