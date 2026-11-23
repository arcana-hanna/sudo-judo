<script lang="ts">
  let { rows, cols, aspect, bg = '', bgAlt = '', walls = [], selected = [], start = null, goal = null,
        onpick, onwall, disabled = false, label = 'Spielfeld' }:
    { rows: number; cols: number; aspect: number; bg?: string; bgAlt?: string; walls?: string[]; selected?: number[];
      start?: { x: number; y: number } | null; goal?: { x: number; y: number } | null;
      onpick?: (i: number) => void; onwall?: (key: string) => void; disabled?: boolean; label?: string } = $props();

  const W = 600;
  const H = $derived(W / aspect);
  const cw = $derived(W / cols), ch = $derived(H / rows);
  const wallSet = $derived(new Set(walls));
  const maxPx = $derived(bg ? 640 : Math.min(640, cols * 84));
  const info = (x: number, y: number) => {
    const out: string[] = [];
    if (start && start.x === x && start.y === y) out.push('Start');
    if (goal && goal.x === x && goal.y === y) out.push('Ziel');
    if (x > 0 && wallSet.has(`${x - 1},${y},r`)) out.push('Wand links');
    if (wallSet.has(`${x},${y},r`)) out.push('Wand rechts');
    if (y > 0 && wallSet.has(`${x},${y - 1},b`)) out.push('Wand oben');
    if (wallSet.has(`${x},${y},b`)) out.push('Wand unten');
    return out.length ? ', ' + out.join(', ') : '';
  };
  const key = (e: KeyboardEvent, fn: () => void) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
</script>

<svg viewBox="0 0 {W} {H}" style="max-width:{maxPx}px" role="group" aria-label={label}>
  {#if bg}<image href={bg} width={W} height={H} preserveAspectRatio="none" />{/if}
  {#if bg && bgAlt}<title>{bgAlt}</title>{/if}

  {#each Array(rows * cols) as _, i (i)}
    {@const x = i % cols}{@const y = Math.floor(i / cols)}
    {@const sel = selected.includes(i)}
    <g class="cell" class:live={!!onpick && !disabled} role={onpick ? 'button' : undefined}
      tabindex={onpick && !disabled ? 0 : undefined} aria-pressed={onpick ? sel : undefined}
      aria-label="Zeile {y + 1}, Spalte {x + 1}{info(x, y)}"
      onclick={() => !disabled && onpick?.(i)} onkeydown={(e) => !disabled && onpick && key(e, () => onpick!(i))}>
      <rect x={x * cw} y={y * ch} width={cw} height={ch} class="sq" class:bgd={!!bg} class:sel />
      {#if start && start.x === x && start.y === y}
        <polygon class="start" points="{x * cw + cw * .3},{y * ch + ch * .25} {x * cw + cw * .75},{y * ch + ch * .5} {x * cw + cw * .3},{y * ch + ch * .75}" />
      {/if}
      {#if goal && goal.x === x && goal.y === y}
        <text class="goal" x={x * cw + cw / 2} y={y * ch + ch / 2} dy=".35em" text-anchor="middle" font-size={Math.min(cw, ch) * .55}>★</text>
      {/if}
    </g>
  {/each}

  {#each walls as k (k)}
    {@const [wx, wy, side] = k.split(',')}
    {#if side === 'r'}
      <line class="wall" x1={(+wx + 1) * cw} y1={+wy * ch} x2={(+wx + 1) * cw} y2={(+wy + 1) * ch} />
    {:else}
      <line class="wall" x1={+wx * cw} y1={(+wy + 1) * ch} x2={(+wx + 1) * cw} y2={(+wy + 1) * ch} />
    {/if}
  {/each}

  {#if onwall}
    {#each Array(rows * cols) as _, i (i)}
      {@const x = i % cols}{@const y = Math.floor(i / cols)}
      {#if x < cols - 1}
        {@const k = `${x},${y},r`}
        <rect class="hit" class:on={wallSet.has(k)} x={(x + 1) * cw - 9} y={y * ch + 4} width="18" height={ch - 8} role="button" tabindex="0"
          aria-pressed={wallSet.has(k)} aria-label="Wand zwischen Zeile {y + 1} Spalte {x + 1} und Spalte {x + 2}"
          onclick={() => onwall(k)} onkeydown={(e) => key(e, () => onwall(k))} />
      {/if}
      {#if y < rows - 1}
        {@const k = `${x},${y},b`}
        <rect class="hit" class:on={wallSet.has(k)} x={x * cw + 4} y={(y + 1) * ch - 9} width={cw - 8} height="18" role="button" tabindex="0"
          aria-pressed={wallSet.has(k)} aria-label="Wand zwischen Spalte {x + 1} Zeile {y + 1} und Zeile {y + 2}"
          onclick={() => onwall(k)} onkeydown={(e) => key(e, () => onwall(k))} />
      {/if}
    {/each}
  {/if}
</svg>

<style>
  svg { width: 100%; height: auto; display: block; border: 3px solid var(--ink); border-radius: 4px; background: var(--paper); touch-action: manipulation; }
  .sq, .wall { vector-effect: non-scaling-stroke; }
  .sq { fill: var(--paper); stroke: var(--line); stroke-width: 1px; }
  .sq.bgd { fill: transparent; stroke: rgba(28, 43, 51, .45); }
  .sq.sel { fill: rgba(10, 108, 140, .38); stroke: var(--accent); stroke-width: 3px; }
  .cell.live { cursor: pointer; }
  .cell.live:hover .sq:not(.sel) { fill: rgba(10, 108, 140, .12); }
  .cell:focus { outline: none; }
  .cell:focus-visible .sq { stroke: var(--accent); stroke-width: 3px; stroke-dasharray: 6 4; }
  .start { fill: var(--ink); pointer-events: none; }
  .goal { fill: var(--good); pointer-events: none; stroke: #fff; stroke-width: 1; paint-order: stroke; }
  .wall { stroke: var(--bad); stroke-width: 5px; stroke-linecap: round; pointer-events: none; }
  .hit { fill: transparent; cursor: pointer; }
  .hit:hover, .hit:focus-visible { fill: rgba(169, 59, 38, .25); outline: none; }
  .hit.on:hover { fill: rgba(169, 59, 38, .5); }
</style>
