<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import type { Program, RobotBlock } from '../../shared/types';
  import { simulate, type Step, type RunResult } from '../../shared/robot/sim';
  import { toPython } from '../../shared/robot/python';
  import { countBlocks } from '../../shared/robot/tree';
  import RobotBoard from '../../shared/ui/RobotBoard.svelte';
  import BlockEditor from '../../shared/ui/BlockEditor.svelte';

  let { block, solved = false, onsolved }:
    { block: RobotBlock; solved?: boolean; onsolved?: () => void } = $props();

  const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  const startStep = (): Step => ({ ...block.world.start, vars: {}, id: null });
  const predict = $derived(block.mode === 'predict');

  let program = $state<Program>(untrack(() => clone(block.starter)));
  let robot = $state<Step>(untrack(startStep));
  let playing = $state(false);
  let msg = $state<{ ok: boolean; text: string } | null>(null);
  let guessCell = $state(-1);
  let guessNum = $state('');
  let timer: ReturnType<typeof setInterval> | undefined;

  const blocks = $derived(countBlocks(program));
  const python = $derived(toPython(program, block.vars));

  function stop() { clearInterval(timer); timer = undefined; playing = false; }
  onDestroy(stop);
  function reset() { stop(); robot = startStep(); msg = null; }

  $effect(() => {
    if (!solved) return;
    stop();
    const sol = block.solution;
    if (!predict && (sol.main.length || sol.defs.length)) program = clone(sol);
    msg = { ok: true, text: 'Richtig!' };
  });

  const fail = (text: string) => (msg = { ok: false, text });
  const atGoal = (s: Step) => block.world.cells[s.y * block.world.cols + s.x] === 2;

  function run() {
    if (playing || solved) return;
    reset();
    const res = simulate(program, block.world, block.vars);
    let i = 0;
    playing = true;
    const ms = res.trace.length > 60 ? 50 : 280;
    timer = setInterval(() => {
      if (i >= res.trace.length) { stop(); finish(res); return; }
      robot = res.trace[i++];
    }, ms);
  }

  function finish(res: RunResult) {
    if (res.status === 'crash') return fail('Der Roboter ist gegen eine Wand gefahren.');
    if (res.status === 'timeout') return fail('Das Programm läuft zu lange – vielleicht endlos.');
    if (!atGoal(res.final)) return fail('Der Roboter ist nicht am Ziel angekommen.');
    if (block.maxBlocks > 0 && blocks > block.maxBlocks)
      return fail(`Das Ziel ist erreicht, aber du brauchst ${blocks} Blöcke. Erlaubt sind höchstens ${block.maxBlocks}.`);
    msg = { ok: true, text: 'Richtig!' };
    onsolved?.();
  }

  function checkPredict() {
    const res = simulate(block.starter, block.world, block.vars);
    const ok = block.predict === 'position'
      ? guessCell === res.final.y * block.world.cols + res.final.x
      : guessNum.trim() !== '' && Number(guessNum) === (res.final.vars[block.predictVar] ?? 0);
    if (ok) { msg = { ok: true, text: 'Richtig!' }; onsolved?.(); } else fail('Noch nicht ganz.');
  }

  const note = $derived(predict
    ? (block.predict === 'position' ? 'Lies das Programm. Klicke das Feld an, auf dem der Roboter am Ende steht.'
        : `Lies das Programm. Welchen Wert hat „${block.predictVar}“ am Ende?`)
    : block.starter.main.length + block.starter.defs.length > 0
      ? 'Dieses Programm funktioniert nicht richtig. Repariere es, bis der Roboter das Ziel (★) erreicht.'
      : 'Baue ein Programm, mit dem der Roboter das Ziel (★) erreicht.');
</script>

<fieldset class="ex" class:solved>
  <legend>{block.question}</legend>
  {#if !solved}<p class="note">{note}</p>{/if}

  <div class="board">
    <RobotBoard world={block.world} {robot} marked={predict ? guessCell : -1}
      onpick={predict && block.predict === 'position' && !solved ? (i) => { guessCell = i; msg = null; } : undefined}
      label="Spielfeld" />
  </div>

  <BlockEditor bind:program allowed={block.allowed} vars={block.vars}
    readonly={predict || playing || solved} activeId={robot.id ?? ''} />

  {#if block.showPython}
    <details class="py">
      <summary>Als Python-Code ansehen</summary>
      <pre><code>{python}</code></pre>
    </details>
  {/if}

  <div class="row">
    {#if predict}
      {#if block.predict === 'variable'}
        <label class="ans">{block.predictVar} =
          <input type="number" bind:value={guessNum} disabled={solved} /></label>
      {/if}
      <button class="check" onclick={checkPredict} disabled={solved || (block.predict === 'position' ? guessCell < 0 : guessNum.trim() === '')}>Prüfen</button>
    {:else}
      <button class="check" onclick={run} disabled={solved || playing}>▶ Ausführen</button>
      <button class="sec" onclick={reset} disabled={solved || (!playing && !msg && robot.id === null)}>↺ Zurücksetzen</button>
      <span class="count" class:over={block.maxBlocks > 0 && blocks > block.maxBlocks}>
        Blöcke: {blocks}{block.maxBlocks > 0 ? ` / ${block.maxBlocks}` : ''}</span>
    {/if}
    <p class="msg" role="status">
      {#if msg?.ok}<span class="ok">{msg.text}</span>
      {:else if msg}<span class="no">{msg.text}</span>{#if block.hint}<span>Tipp: {block.hint}</span>{/if}{/if}
    </p>
  </div>
</fieldset>

<style>
  .ex { border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem 1.25rem 1.25rem; margin: 0 0 1.5rem; min-width: 0; }
  .ex.solved { border-color: var(--good); }
  legend { font-weight: 650; font-size: 1.15rem; padding: 0 .5rem; margin-left: -.5rem; max-width: 60ch; }
  .note { color: var(--muted); margin: 0 0 .75rem; font-size: .95rem; }
  .board { margin-bottom: 1rem; }
  .py { margin-top: 1rem; }
  .py summary { cursor: pointer; font-weight: 600; color: var(--accent); }
  pre { background: var(--ink); color: #f3f6f8; padding: .8rem 1rem; border-radius: var(--radius); overflow: auto; font-size: .9rem; line-height: 1.45; margin: .5rem 0 0; }
  code { font-family: ui-monospace, "Cascadia Code", Consolas, Menlo, monospace; }
  .row { display: flex; align-items: center; gap: .75rem; margin-top: 1rem; flex-wrap: wrap; }
  .check { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: var(--radius); padding: .6rem 1.4rem; font-weight: 650; cursor: pointer; }
  .check:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .sec { background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius); padding: .5rem 1rem; font-weight: 600; cursor: pointer; }
  .sec:disabled { opacity: .45; cursor: default; }
  .count { color: var(--muted); font-size: .95rem; }
  .count.over { color: var(--bad); font-weight: 650; }
  .ans { display: flex; align-items: center; gap: .4rem; font-weight: 650; }
  .ans input { width: 5rem; padding: .45rem .6rem; border: 2px solid var(--line); border-radius: var(--radius); }
  .msg { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
  .ok { color: var(--good); font-weight: 650; }
  .no { color: var(--bad); font-weight: 650; }
</style>
