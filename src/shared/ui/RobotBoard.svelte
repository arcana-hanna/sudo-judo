<script lang="ts">
  import type { World } from '../types';
  import type { Step } from '../robot/sim';
  let { world, robot, onpick, marked = -1, showStart = false, label = 'Spielfeld', size = 44 }:
    { world: World; robot: Pick<Step, 'x' | 'y' | 'dir' | 'bump'>; onpick?: (i: number) => void;
      marked?: number; showStart?: boolean; label?: string; size?: number } = $props();
  const C = 40;
  const DIRS = ['Norden', 'Osten', 'Süden', 'Westen'];
  const arrow = '0,-14 11,12 0,6 -11,12';
</script>

<svg viewBox="0 0 {world.cols * C} {world.rows * C}" style="max-width:{world.cols * size}px" role="group" aria-label={label}>
  {#each world.cells as v, i (i)}
    {@const cx = (i % world.cols) * C}{@const cy = Math.floor(i / world.cols) * C}
    <g class="cell" class:live={!!onpick} role={onpick ? 'button' : undefined} tabindex={onpick ? 0 : undefined}
      aria-label="Zeile {Math.floor(i / world.cols) + 1}, Spalte {(i % world.cols) + 1}{v === 1 ? ', Wand' : v === 2 ? ', Ziel' : ''}"
      onclick={() => onpick?.(i)} onkeydown={(e) => { if (onpick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onpick(i); } }}>
      <rect x={cx} y={cy} width={C} height={C} class="sq" class:wall={v === 1} class:goal={v === 2} />
      {#if v === 2}<text x={cx + C / 2} y={cy + C / 2} dy=".35em" text-anchor="middle" class="star">★</text>{/if}
      {#if marked === i}<rect x={cx + 3} y={cy + 3} width={C - 6} height={C - 6} class="mark" rx="4" />{/if}
    </g>
  {/each}

  {#if showStart}
    <g transform="translate({world.start.x * C + C / 2} {world.start.y * C + C / 2}) rotate({world.start.dir * 90})" opacity=".4">
      <polygon points={arrow} class="bot" /></g>
  {/if}
  <g transform="translate({robot.x * C + C / 2} {robot.y * C + C / 2}) rotate({robot.dir * 90})" role="img"
    aria-label="Roboter, blickt nach {DIRS[robot.dir]}">
    <polygon points={arrow} class="bot" class:bump={robot.bump} />
  </g>
</svg>

<style>
  svg { width: 100%; height: auto; display: block; border: 3px solid var(--ink); border-radius: 4px; background: var(--paper); }
  .sq { fill: var(--paper); stroke: var(--line); stroke-width: 1.5; }
  .sq.wall { fill: var(--ink); }
  .sq.goal { fill: var(--good-wash); }
  .star { fill: var(--good); font-size: 22px; pointer-events: none; }
  .cell.live { cursor: pointer; }
  .cell.live:hover .sq:not(.wall) { fill: var(--wash); }
  .cell:focus { outline: none; }
  .cell:focus-visible .sq { stroke: var(--accent); stroke-width: 4; }
  .mark { fill: none; stroke: var(--accent); stroke-width: 4; pointer-events: none; }
  .bot { fill: var(--accent); stroke: #fff; stroke-width: 2; pointer-events: none; }
  .bot.bump { fill: var(--bad); }
</style>
