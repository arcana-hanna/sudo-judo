<script lang="ts">
  import type { GridBlock } from '../../shared/types';
  import GridBoard from '../../shared/ui/GridBoard.svelte';
  import AnswerTabs from '../AnswerTabs.svelte';
  import Steps from '../ui/Steps.svelte';
  import Stepper from '../ui/Stepper.svelte';
  import Seg from '../ui/Seg.svelte';
  let { block = $bindable() }: { block: GridBlock } = $props();

  let step = $state<'build' | 'solve'>('build');
  let cur = $state(0);
  const sets = $derived([block.target, ...(block.alts ?? [])]);
  const answer = $derived(sets[Math.min(cur, sets.length - 1)]);
  const size = $derived(block.cols <= 6 ? '2.8rem' : block.cols <= 9 ? '2.2rem' : '1.8rem');

  function resize(arr: number[], oldCols: number, rows: number, cols: number) {
    const out = new Array(rows * cols).fill(0);
    for (let r = 0; r < Math.min(rows, arr.length / oldCols); r++)
      for (let c = 0; c < Math.min(cols, oldCols); c++) out[r * cols + c] = arr[r * oldCols + c];
    return out;
  }
  function setSize(rows: number, cols: number) {
    rows = Math.min(12, Math.max(1, rows)); cols = Math.min(12, Math.max(1, cols));
    block.start = resize(block.start, block.cols, rows, cols);
    block.target = resize(block.target, block.cols, rows, cols);
    block.alts = (block.alts ?? []).map((a) => resize(a, block.cols, rows, cols));
    block.rows = rows; block.cols = cols;
  }
  function setColors(n: number) {
    block.colors = n;
    const fix = (a: number[]) => a.map((v) => (v >= n ? 0 : v));
    block.start = fix(block.start); block.target = fix(block.target); block.alts = (block.alts ?? []).map(fix);
  }
  const cycle = (arr: number[], i: number) => { arr[i] = (arr[i] + 1) % block.colors; };
  const addAlt = () => { block.alts = [...(block.alts ?? []), [...answer]]; cur = block.alts.length; };
  const delAlt = () => { if (cur > 0) { block.alts!.splice(cur - 1, 1); cur = 0; } };
</script>

<Steps bind:step />

{#if step === 'build'}
  <p class="cap">So sehen die Schüler das Raster am Anfang. Klicke ein Feld, um die Farbe zu wechseln.</p>
  <GridBoard cells={block.start} cols={block.cols} {size} label="Startbild" onpick={(i) => cycle(block.start, i)} />
  <div class="set">
    <Stepper label="Zeilen" value={block.rows} onchange={(v) => setSize(v, block.cols)} />
    <Stepper label="Spalten" value={block.cols} onchange={(v) => setSize(block.rows, v)} />
    <span class="grp"><span class="lab">Farben</span>
      <Seg label="Anzahl der Farben" value={block.colors} options={[{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }]} onchange={setColors} /></span>
  </div>
{:else}
  <p class="cap">Färbe das Raster so, wie es am Ende aussehen soll – das ist die Lösung.</p>
  <AnswerTabs count={sets.length} bind:cur onadd={addAlt} ondel={delAlt} />
  <GridBoard cells={answer} cols={block.cols} {size} label="Lösung {cur + 1}" onpick={(i) => cycle(answer, i)} />
{/if}

<style>
  .cap { margin: 0 0 .6rem; font-size: .9rem; color: var(--muted); }
  .set { display: flex; gap: 1.2rem; align-items: center; flex-wrap: wrap; margin-top: .8rem; }
  .grp { display: inline-flex; align-items: center; gap: .4rem; font-size: .9rem; } .lab { color: var(--muted); }
</style>
