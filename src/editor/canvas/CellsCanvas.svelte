<script lang="ts">
  import type { CellsBlock } from '../../shared/types';
  import CellBoard from '../../shared/ui/CellBoard.svelte';
  import AnswerTabs from '../AnswerTabs.svelte';
  import Steps from '../ui/Steps.svelte';
  import Stepper from '../ui/Stepper.svelte';
  import ToolBar from '../ui/ToolBar.svelte';
  import Inline from '../ui/Inline.svelte';
  import ImgField from '../ImgField.svelte';
  let { block = $bindable() }: { block: CellsBlock } = $props();

  type Tool = 'wall' | 'start' | 'goal';
  let step = $state<'build' | 'solve'>('build');
  let tool = $state<Tool>('wall');
  let cur = $state(0);
  const tools: [Tool, string][] = [['wall', 'Wände'], ['start', 'Start'], ['goal', 'Ziel']];
  const hint: Record<Tool, string> = {
    wall: 'Klicke zwischen zwei Felder, um eine Wand zu setzen oder zu entfernen.',
    start: 'Klicke ein Feld, um den Start zu markieren (nochmal klicken entfernt ihn).',
    goal: 'Klicke ein Feld, um das Ziel zu markieren (nochmal klicken entfernt es).',
  };

  $effect(() => { if (!block.bg) { block.bg = ''; block.bgAlt = ''; block.aspect = block.cols / block.rows; } });
  const answer = $derived(block.answers[Math.min(cur, block.answers.length - 1)]);
  const addAlt = () => { block.answers.push([...answer]); cur = block.answers.length - 1; };
  const delAlt = () => { if (block.answers.length > 1) { block.answers.splice(cur, 1); cur = 0; } };

  function pickBuild(i: number) {
    const x = i % block.cols, y = Math.floor(i / block.cols);
    if (tool === 'start') block.start = block.start?.x === x && block.start?.y === y ? null : { x, y };
    else if (tool === 'goal') block.goal = block.goal?.x === x && block.goal?.y === y ? null : { x, y };
  }
  function pickSolve(i: number) { const k = answer.indexOf(i); if (k >= 0) answer.splice(k, 1); else answer.push(i); }
  function toggleWall(k: string) { const i = block.walls.indexOf(k); if (i >= 0) block.walls.splice(i, 1); else block.walls.push(k); }

  function resize(rows: number, cols: number) {
    rows = Math.min(12, Math.max(1, rows)); cols = Math.min(12, Math.max(1, cols));
    const old = block.cols;
    const remap = (i: number) => { const x = i % old, y = Math.floor(i / old); return x < cols && y < rows ? y * cols + x : -1; };
    block.answers = block.answers.map((a) => a.map(remap).filter((i) => i >= 0));
    block.walls = block.walls.filter((k) => { const [x, y, s] = k.split(','); return +x < cols - (s === 'r' ? 1 : 0) && +y < rows - (s === 'b' ? 1 : 0); });
    if (block.start && (block.start.x >= cols || block.start.y >= rows)) block.start = null;
    if (block.goal && (block.goal.x >= cols || block.goal.y >= rows)) block.goal = null;
    block.rows = rows; block.cols = cols;
    if (!block.bg) block.aspect = cols / rows;
  }
</script>

<Steps bind:step />

{#if step === 'build'}
  <p class="cap">So sehen die Schüler das Spielfeld. {hint[tool]}</p>
  <ToolBar tools={tools.map(([id, label]) => ({ id, label }))} value={tool} onchange={(t) => (tool = t)} />
  <CellBoard rows={block.rows} cols={block.cols} aspect={block.aspect} bg={block.bg} bgAlt={block.bgAlt}
    walls={block.walls} selected={[]} start={block.start} goal={block.goal}
    onpick={tool === 'wall' ? undefined : pickBuild} onwall={tool === 'wall' ? toggleWall : undefined} label="Spielfeld bearbeiten" />
  <div class="set">
    <Stepper label="Zeilen" value={block.rows} onchange={(v) => resize(v, block.cols)} />
    <Stepper label="Spalten" value={block.cols} onchange={(v) => resize(block.rows, v)} />
  </div>
  <details class="bg">
    <summary>Hintergrundbild (optional)</summary>
    <p class="cap">Das Raster wird über das Bild gelegt. Stelle Zeilen und Spalten passend zum Bild ein.</p>
    <div class="bgrow"><ImgField bind:value={block.bg} max={900} label="Hintergrundbild wählen" removeLabel="Hintergrundbild entfernen"
      onimage={(d) => (block.aspect = d.w / d.h)} /></div>
    {#if block.bg}
      <label class="alt"><span>Bildbeschreibung für Screenreader:</span>
        <Inline bind:value={block.bgAlt} placeholder="z. B. Foto eines Schulhofs" label="Beschreibung des Hintergrundbilds" /></label>
    {/if}
  </details>
{:else}
  <p class="cap">Klicke die Felder an, die die Schüler auswählen sollen – das ist die Lösung. Mehrere richtige Lösungen sind möglich.</p>
  <AnswerTabs count={block.answers.length} bind:cur onadd={addAlt} ondel={delAlt} />
  <CellBoard rows={block.rows} cols={block.cols} aspect={block.aspect} bg={block.bg} bgAlt={block.bgAlt}
    walls={block.walls} selected={answer} start={block.start} goal={block.goal} onpick={pickSolve} label="Lösung {cur + 1}" />
{/if}

<style>
  .cap { margin: 0 0 .6rem; font-size: .9rem; color: var(--muted); }
  .tools { display: flex; gap: .4rem; margin-bottom: .6rem; flex-wrap: wrap; }
  .set { display: flex; gap: 1.2rem; margin-top: .8rem; flex-wrap: wrap; }
  .bg { margin-top: .8rem; font-size: .95rem; } .bg summary { cursor: pointer; color: var(--accent); }
  .bgrow { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; margin-bottom: .5rem; }
  .alt { display: flex; gap: .5rem; align-items: center; margin: .3rem 0; font-size: .92rem; } .alt span { color: var(--muted); white-space: nowrap; }
</style>
