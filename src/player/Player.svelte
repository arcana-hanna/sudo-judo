<script lang="ts">
  import { untrack } from 'svelte';
  import type { Project } from '../shared/types';
  import { loadSolved, saveSolved } from '../shared/progress';
  import { playerBlocks } from './registry';

  let { project, useHash = false, persist = false, start = '' }:
    { project: Project; useHash?: boolean; persist?: boolean; start?: string } = $props();

  let route = $state(untrack(() => start)); // '' = Menü, sonst Seiten-ID
  let h1: HTMLElement | undefined = $state();
  let firstRoute = true;
  let solvedIds = $state<string[]>([]);

  const readHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));

  $effect(() => {
    if (!useHash) return;
    const sync = () => { route = readHash(); window.scrollTo(0, 0); };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  });

  $effect(() => { if (persist) solvedIds = loadSolved(project.id); });

  // Seitenwechsel: Fokus auf die Überschrift (Screenreader) und passender Tab-Titel.
  $effect(() => {
    route;
    if (!useHash) return;
    if (firstRoute) { firstRoute = false; return; }
    queueMicrotask(() => h1?.focus());
  });
  $effect(() => { if (useHash) document.title = page ? `${page.title} – ${project.title}` : project.title; });

  function go(id: string) {
    if (useHash) location.hash = id ? '#/' + encodeURIComponent(id) : '#/';
    else route = id;
  }
  function markSolved(id: string) {
    if (solvedIds.includes(id)) return;
    solvedIds = [...solvedIds, id];
    if (persist) saveSolved(project.id, solvedIds);
  }

  const exercises = (p: { blocks: { id: string; type: string }[] }) =>
    p.blocks.filter((b) => playerBlocks[b.type]?.exercise);
  const solvedCount = (p: { blocks: { id: string; type: string }[] }) =>
    exercises(p).filter((b) => solvedIds.includes(b.id)).length;

  const totalEx = $derived(project.pages.reduce((n, p) => n + exercises(p).length, 0));
  const doneEx = $derived(project.pages.reduce((n, p) => n + solvedCount(p), 0));
  function resetProgress() {
    if (!confirm('Den Fortschritt auf diesem Gerät wirklich zurücksetzen?')) return;
    solvedIds = []; saveSolved(project.id, []);
  }

  const index = $derived(project.pages.findIndex((p) => p.id === route));
  const page = $derived(index >= 0 ? project.pages[index] : undefined);
</script>

<div class="player">
  <header class="bar">
    <button class="home" onclick={() => go('')}>{project.title}</button>
  </header>

  <main>
    <h1 tabindex="-1" bind:this={h1}>{page ? page.title : project.title}</h1>
    {#if page}
      {#each page.blocks as block (block.id)}
        {@const def = playerBlocks[block.type]}
        {#if def}
          <def.component {block} solved={solvedIds.includes(block.id)} onsolved={() => markSolved(block.id)} />
        {:else}
          <p class="unknown">Dieser Inhalt („{block.type}“) wird von dieser Version nicht unterstützt.</p>
        {/if}
      {/each}

      <nav class="pager">
        <button disabled={index === 0} onclick={() => go(project.pages[index - 1].id)}>Zurück</button>
        <button onclick={() => go('')}>Menü</button>
        <button class="primary" disabled={index === project.pages.length - 1}
          onclick={() => go(project.pages[index + 1].id)}>Weiter</button>
      </nav>
    {:else}
      {#if totalEx > 0}
        <div class="sum">
          <p>{doneEx} von {totalEx} Aufgaben gelöst</p>
          <progress max={totalEx} value={doneEx} aria-label="Fortschritt"></progress>
        </div>
      {/if}
      {#if project.pages.length === 0}
        <p>Diese Aufgabensammlung hat noch keine Seiten.</p>
      {/if}
      <ul class="menu">
        {#each project.pages as p (p.id)}
          {@const total = exercises(p).length}
          {@const done = solvedCount(p)}
          <li>
            <button class="card" class:done={total > 0 && done === total} onclick={() => go(p.id)}>
              <span class="name">{p.title || 'Ohne Titel'}</span>
              <span class="status">
                {#if total === 0}Lesen
                {:else if done === total}✓ Alles gelöst
                {:else}{done} von {total} gelöst{/if}
              </span>
            </button>
          </li>
        {/each}
      </ul>
      {#if persist && solvedIds.length > 0}
        <p class="reset"><button class="link" onclick={resetProgress}>Fortschritt auf diesem Gerät zurücksetzen</button></p>
      {/if}
    {/if}
  </main>
</div>

<style>
  .player { font-size: 1.125rem; min-height: 100%; }
  .bar { border-bottom: 2px solid var(--line); padding: .5rem 1.5rem; }
  .home { background: none; border: 0; font-weight: 700; color: var(--accent); cursor: pointer; padding: .25rem 0; font-size: 1rem; }
  main { max-width: 46rem; margin: 0 auto; padding: 1.5rem 1.5rem 4rem; }
  h1 { font-size: 1.9rem; line-height: 1.2; margin: .5rem 0 1.25rem; }
  .menu { list-style: none; padding: 0; margin: 0; display: grid; gap: .75rem; }
  .card { width: 100%; text-align: left; display: flex; justify-content: space-between; gap: 1rem; align-items: baseline;
          padding: 1rem 1.25rem; background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius); cursor: pointer; }
  .card:hover { border-color: var(--accent); background: var(--wash); }
  .card.done { border-color: var(--good); }
  .name { font-weight: 650; }
  .status { color: var(--muted); font-size: .95rem; white-space: nowrap; }
  .done .status { color: var(--good); font-weight: 650; }
  .pager { display: flex; gap: .75rem; justify-content: space-between; margin-top: 2.5rem; padding-top: 1.25rem; border-top: 2px solid var(--line); }
  .pager button { padding: .6rem 1.2rem; border: 2px solid var(--line); background: var(--paper); border-radius: var(--radius); cursor: pointer; font-weight: 600; }
  .pager button.primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .pager button:disabled { opacity: .4; cursor: default; }
  h1:focus { outline: none; }
  .sum { margin: 0 0 1.25rem; }
  .sum p { margin: 0 0 .3rem; color: var(--muted); font-size: 1rem; }
  progress { width: 100%; height: .7rem; accent-color: var(--accent); }
  .reset { margin: 2rem 0 0; }
  .link { background: none; border: 0; padding: 0; color: var(--muted); font-size: .9rem; text-decoration: underline; cursor: pointer; }
  .link:hover { color: var(--accent); }
  .unknown { color: var(--bad); }
</style>
