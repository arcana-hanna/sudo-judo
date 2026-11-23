<script lang="ts">
  import type { RobotBlock, StmtType } from '../../shared/types';
  import { simulate } from '../../shared/robot/sim';
  import { countBlocks } from '../../shared/robot/tree';
  import RobotBoard from '../../shared/ui/RobotBoard.svelte';
  import BlockEditor from '../../shared/ui/BlockEditor.svelte';
  import Steps from '../ui/Steps.svelte';
  import Seg from '../ui/Seg.svelte';
  import Stepper from '../ui/Stepper.svelte';
  import ToolBar from '../ui/ToolBar.svelte';
  let { block = $bindable() }: { block: RobotBlock } = $props();

  type Tool = 'wall' | 'goal' | 'start' | 'erase';
  let step = $state<'build' | 'solve'>('build');
  let tool = $state<Tool>('wall');
  const tools = [{ id: 'wall', label: 'Wand' }, { id: 'goal', label: 'Ziel' }, { id: 'start', label: 'Startfeld' }, { id: 'erase', label: 'Radieren' }];
  const typeNames: [StmtType, string, string][] = [
    ['move', 'vorwärts', 'motion'], ['left', 'links drehen', 'motion'], ['right', 'rechts drehen', 'motion'],
    ['repeat', 'wiederhole', 'control'], ['if', 'falls', 'control'], ['ifelse', 'falls/sonst', 'control'], ['while', 'solange', 'control'],
    ['set', 'setze Variable', 'vars'], ['change', 'ändere Variable', 'vars'], ['call', 'eigene Blöcke', 'my'],
  ];
  const DIRS = [{ value: 0, label: '↑', title: 'Norden' }, { value: 1, label: '→', title: 'Osten' }, { value: 2, label: '↓', title: 'Süden' }, { value: 3, label: '←', title: 'Westen' }];

  const predicting = $derived(block.mode === 'predict');
  const filled = (p: { main: unknown[]; defs: unknown[] }) => p.main.length + p.defs.length > 0;

  function pick(i: number) {
    const w = block.world, x = i % w.cols, y = Math.floor(i / w.cols);
    const isStart = w.start.x === x && w.start.y === y;
    if (tool === 'start') { w.start.x = x; w.start.y = y; w.cells[i] = 0; return; }
    if (tool === 'wall') { if (isStart) return; w.cells[i] = w.cells[i] === 1 ? 0 : 1; }
    else if (tool === 'goal') { w.cells = w.cells.map((c) => (c === 2 ? 0 : c)); w.cells[i] = 2; }
    else w.cells[i] = 0;
  }
  function resize(rows: number, cols: number) {
    rows = Math.min(12, Math.max(3, rows)); cols = Math.min(12, Math.max(3, cols));
    const w = block.world, cells = new Array(rows * cols).fill(0);
    for (let r = 0; r < Math.min(rows, w.rows); r++) for (let c = 0; c < Math.min(cols, w.cols); c++) cells[r * cols + c] = w.cells[r * w.cols + c];
    w.cells = cells; w.rows = rows; w.cols = cols;
    w.start.x = Math.min(w.start.x, cols - 1); w.start.y = Math.min(w.start.y, rows - 1);
  }
  function setVars(text: string) {
    block.vars = [...new Set(text.split(/[,\s]+/).map((s) => s.toLowerCase().replace(/[^a-z0-9_]/g, '')).filter((s) => /^[a-z_]/.test(s)))].slice(0, 5);
    if (!block.vars.includes(block.predictVar)) block.predictVar = block.vars[0] ?? 'x';
    if (block.vars.length === 0 && block.predict === 'variable') block.predict = 'position';
  }
  const toggleType = (t: StmtType) => { block.allowed = block.allowed.includes(t) ? block.allowed.filter((x) => x !== t) : [...block.allowed, t]; };

  const solRun = $derived(simulate(block.solution, block.world, block.vars));
  const solOk = $derived(solRun.status === 'ok' && block.world.cells[solRun.final.y * block.world.cols + solRun.final.x] === 2);
  const solBlocks = $derived(countBlocks(block.solution));
  const predRun = $derived(simulate(block.starter, block.world, block.vars));
  const answerText = $derived(block.predict === 'position'
    ? `Zeile ${predRun.final.y + 1}, Spalte ${predRun.final.x + 1}` : `${block.predictVar} = ${predRun.final.vars[block.predictVar] ?? 0}`);
</script>

<div class="task">
  <span class="lab">Aufgabentyp</span>
  <Seg label="Aufgabentyp" value={block.mode} onchange={(v) => { block.mode = v; step = 'build'; }}
    options={[{ value: 'build', label: 'Programm bauen oder reparieren' }, { value: 'predict', label: 'Ergebnis vorhersagen' }]} />
</div>

<Steps bind:step solveLabel={predicting ? 'Antwort ansehen' : 'Lösung vormachen'} />

{#if step === 'build'}
  <p class="cap">So sehen die Schüler das Spielfeld. Zeichne es mit den Werkzeugen.</p>
  <ToolBar {tools} value={tool} onchange={(t) => (tool = t)} />
  <RobotBoard world={block.world} robot={block.world.start} onpick={pick} label="Spielfeld bearbeiten" />
  <div class="set">
    <Stepper label="Zeilen" value={block.world.rows} min={3} onchange={(v) => resize(v, block.world.cols)} />
    <Stepper label="Spalten" value={block.world.cols} min={3} onchange={(v) => resize(block.world.rows, v)} />
    <span class="grp"><span class="lab">Blickrichtung</span><Seg label="Blickrichtung des Roboters" value={block.world.start.dir} options={DIRS} onchange={(v) => (block.world.start.dir = v)} /></span>
  </div>

  <p class="cap h">{predicting ? 'Blöcke, die im Programm vorkommen dürfen' : 'Blöcke, die die Schüler benutzen dürfen'}</p>
  <div class="allowed" role="group" aria-label="Erlaubte Blöcke">
    {#each typeNames as [t, name, cat] (t)}
      <button class="al {cat}" class:off={!block.allowed.includes(t)} aria-pressed={block.allowed.includes(t)} onclick={() => toggleType(t)}>
        <span aria-hidden="true">{block.allowed.includes(t) ? '✓' : '+'}</span> {name}</button>
    {/each}
  </div>
  <label class="vr"><span class="lab">Variablen:</span>
    <input class="inl" value={block.vars.join(', ')} onchange={(e) => setVars(e.currentTarget.value)} placeholder="keine – oder z. B. x, zaehler" aria-label="Variablen (durch Komma getrennt)" /></label>

  {#if predicting}
    <div class="set">
      <span class="grp"><span class="lab">Gefragt ist</span>
        <Seg label="Was wird gefragt?" value={block.predict} onchange={(v) => (block.predict = v)}
          options={[{ value: 'position', label: 'das Endfeld des Roboters' }, ...(block.vars.length ? [{ value: 'variable', label: 'der Wert einer Variable' }] : [])]} /></span>
      {#if block.predict === 'variable'}
        <select bind:value={block.predictVar} aria-label="Welche Variable?">{#each block.vars as v}<option value={v}>{v}</option>{/each}</select>
      {/if}
    </div>
  {:else}
    <div class="set"><Stepper label="Höchstens … Blöcke" value={block.maxBlocks} min={0} max={99} onchange={(v) => (block.maxBlocks = v)} /><small>0 = unbegrenzt</small></div>
  {/if}

  <details class="prog" open={predicting || filled(block.starter)}>
    <summary>{predicting ? 'Programm, das die Schüler lesen' : 'Startprogramm zum Reparieren (optional)'}</summary>
    <BlockEditor bind:program={block.starter} allowed={block.allowed} vars={block.vars} />
  </details>
  <label class="chk"><input type="checkbox" bind:checked={block.showPython} /> Schülern den Python-Code zeigen</label>
{:else if predicting}
  <p class="cap">So lautet die richtige Antwort – der Computer führt das Programm für dich aus:</p>
  {#if block.predict === 'position'}<RobotBoard world={block.world} robot={predRun.final} label="Endstand des Programms" />{/if}
  {#if predRun.status !== 'ok'}<p class="warn">Das Programm stößt an eine Wand oder läuft endlos – prüfe, ob das so gewollt ist.</p>
  {:else}<p class="okmsg">Antwort: {answerText}</p>{/if}
{:else}
  <p class="cap">Baue eine Lösung – genau wie ein Schüler. Ich prüfe, ob sie das Ziel erreicht.</p>
  <RobotBoard world={block.world} robot={block.world.start} label="Spielfeld" />
  <div class="sol"><BlockEditor bind:program={block.solution} allowed={block.allowed} vars={block.vars} /></div>
  {#if !filled(block.solution)}
    <p class="muted">Baue eine Lösung, dann prüfe ich, ob die Aufgabe lösbar ist.</p>
  {:else if solOk}
    <p class="okmsg">✓ Die Musterlösung erreicht das Ziel ({solBlocks} Blöcke).{block.maxBlocks > 0 && solBlocks > block.maxBlocks ? ' Aber: mehr Blöcke als erlaubt!' : ''}</p>
  {:else}
    <p class="warn">Die Musterlösung erreicht das Ziel nicht ({solRun.status === 'crash' ? 'Wand' : solRun.status === 'timeout' ? 'läuft endlos' : 'nicht am Ziel'}).</p>
  {/if}
{/if}

<style>
  .task { display: flex; gap: .8rem; align-items: center; flex-wrap: wrap; }
  .lab { color: var(--muted); font-size: .9rem; }
  .cap { margin: .2rem 0 .6rem; font-size: .9rem; color: var(--muted); } .cap.h { margin-top: 1rem; }
  .set { display: flex; gap: 1.2rem; align-items: center; flex-wrap: wrap; margin-top: .8rem; }
  .grp { display: inline-flex; gap: .4rem; align-items: center; }
  .allowed { display: flex; flex-wrap: wrap; gap: .35rem; }
  .al { color: #fff; border: 0 !important; border-radius: 8px !important; padding: .3rem .7rem !important; font-size: .88rem; box-shadow: 0 2px 0 rgba(0,0,0,.25); }
  .al.motion { background: var(--blk-motion) !important; } .al.control { background: var(--blk-control) !important; }
  .al.vars { background: var(--blk-vars) !important; } .al.my { background: var(--blk-my) !important; }
  .al.off { background: var(--paper) !important; color: var(--muted); border: 2px dashed var(--line) !important; box-shadow: none; }
  .vr { display: flex; gap: .5rem; align-items: center; margin-top: .7rem; } .vr .inl { max-width: 18rem; }
  .prog { margin-top: .9rem; } .prog summary { cursor: pointer; font-weight: 600; color: var(--accent); margin-bottom: .5rem; }
  .sol { margin-top: .8rem; }
  .chk { display: inline-flex; gap: .4rem; align-items: center; font-size: .92rem; margin-top: .8rem; }
  select { padding: .4rem; border: 2px solid var(--line); border-radius: var(--radius); background: var(--paper); }
  small { color: var(--muted); }
  .warn { color: var(--bad); margin: .5rem 0 0; font-size: .9rem; }
  .okmsg { color: var(--good); margin: .5rem 0 0; font-size: .92rem; font-weight: 650; }
  .muted { color: var(--muted); margin: .5rem 0 0; font-size: .9rem; }
</style>
