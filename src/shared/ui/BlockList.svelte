<script lang="ts">
  import BlockList from './BlockList.svelte';
  import CondEdit from './CondEdit.svelte';
  import ValEdit from './ValEdit.svelte';
  import { dnd } from './dnd.svelte';
  import { containsList, findStmt, newStmt, removeById } from '../robot/tree';
  import type { Program, Stmt } from '../types';

  let { list, program, vars, readonly = false, activeId = '' }:
    { list: Stmt[]; program: Program; vars: string[]; readonly?: boolean; activeId?: string } = $props();

  let over = $state(-1);

  function insertAt(index: number) {
    if (readonly) return;
    const d = dnd.drag;
    if (d?.kind === 'move') {
      const moving = findStmt(program, d.id);
      if (!moving || containsList(moving, list)) return;       // nicht in sich selbst einfügen
      const from = list.findIndex((s) => s.id === d.id);
      const copy = $state.snapshot(moving) as Stmt;
      removeById(program, d.id);
      list.splice(from >= 0 && from < index ? index - 1 : index, 0, copy);
    } else if (d?.kind === 'new') {
      list.splice(index, 0, newStmt(d.t, vars, program));
    } else if (dnd.armed) {
      list.splice(index, 0, newStmt(dnd.armed, vars, program));
    }
    dnd.drag = null; dnd.armed = ''; over = -1;
  }
  const remove = (id: string) => removeById(program, id);
  function grab(e: DragEvent, s: Stmt) {
    const blk = (e.currentTarget as HTMLElement).closest('.blk') as HTMLElement;
    e.dataTransfer?.setData('text/plain', s.id);
    e.dataTransfer?.setDragImage(blk, 12, 12);
    dnd.drag = { kind: 'move', id: s.id };
  }
  const press = (fn: () => void) => (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
</script>

{#snippet gap(i: number)}
  {#if !readonly}
    <div class="slot" class:hot={dnd.armed || dnd.drag} class:over={over === i} class:empty={list.length === 0}
      role="button" tabindex={dnd.armed ? 0 : -1} aria-label="Block hier einfügen"
      ondragover={(e) => { e.preventDefault(); e.stopPropagation(); over = i; }}
      ondragleave={() => (over = -1)}
      ondrop={(e) => { e.preventDefault(); e.stopPropagation(); insertAt(i); }}
      onclick={(e) => { e.stopPropagation(); if (dnd.armed) insertAt(i); }}
      onkeydown={press(() => dnd.armed && insertAt(i))}></div>
  {/if}
{/snippet}

{#snippet head(s: Stmt)}
  {#if !readonly}
    <span class="grip" draggable="true" ondragstart={(e) => grab(e, s)} ondragend={() => (dnd.drag = null)}
      title="Zum Verschieben ziehen" aria-hidden="true">⠿</span>
  {/if}
{/snippet}
{#snippet del(s: Stmt)}
  {#if !readonly}<button class="x" onclick={() => remove(s.id)} aria-label="Block löschen" title="Block löschen">✕</button>{/if}
{/snippet}

<div class="list" class:ro={readonly}>
  {#each list as s, i (s.id)}
    {@render gap(i)}
    <div class="blk {s.t}" class:active={activeId === s.id}>
      {#if s.t === 'move' || s.t === 'left' || s.t === 'right'}
        <div class="row">{@render head(s)}
          <span>{s.t === 'move' ? 'gehe einen Schritt vor' : s.t === 'left' ? 'drehe dich nach links ↶' : 'drehe dich nach rechts ↷'}</span>
          {@render del(s)}</div>

      {:else if s.t === 'repeat'}
        <div class="row">{@render head(s)}<span>wiederhole</span>
          <ValEdit bind:val={s.n} {vars} {readonly} min={0} /><span>mal</span>{@render del(s)}</div>
        <div class="inner"><BlockList list={s.body} {program} {vars} {readonly} {activeId} /></div>
        <div class="foot"></div>

      {:else if s.t === 'while'}
        <div class="row">{@render head(s)}<span>wiederhole solange</span>
          <CondEdit bind:c={s.c} {vars} {readonly} />{@render del(s)}</div>
        <div class="inner"><BlockList list={s.body} {program} {vars} {readonly} {activeId} /></div>
        <div class="foot"></div>

      {:else if s.t === 'if'}
        <div class="row">{@render head(s)}<span>falls</span>
          <CondEdit bind:c={s.c} {vars} {readonly} /><span>dann</span>{@render del(s)}</div>
        <div class="inner"><BlockList list={s.then} {program} {vars} {readonly} {activeId} /></div>
        <div class="foot"></div>

      {:else if s.t === 'ifelse'}
        <div class="row">{@render head(s)}<span>falls</span>
          <CondEdit bind:c={s.c} {vars} {readonly} /><span>dann</span>{@render del(s)}</div>
        <div class="inner"><BlockList list={s.then} {program} {vars} {readonly} {activeId} /></div>
        <div class="row mid"><span>sonst</span></div>
        <div class="inner"><BlockList list={s.else} {program} {vars} {readonly} {activeId} /></div>
        <div class="foot"></div>

      {:else if s.t === 'set' || s.t === 'change'}
        <div class="row">{@render head(s)}<span>{s.t === 'set' ? 'setze' : 'ändere'}</span>
          {#if readonly}<span class="ro-pill">{s.v}</span>
          {:else}<select bind:value={s.v} aria-label="Variable">{#each vars as n}<option value={n}>{n}</option>{/each}</select>{/if}
          <span>{s.t === 'set' ? 'auf' : 'um'}</span><ValEdit bind:val={s.val} {vars} {readonly} />{@render del(s)}</div>

      {:else if s.t === 'call'}
        <div class="row">{@render head(s)}
          {#if readonly}<span class="ro-pill">{program.defs.find((d) => d.id === s.f)?.name ?? '?'}</span>
          {:else}
            <select bind:value={s.f} aria-label="Eigener Block">
              {#each program.defs as d (d.id)}<option value={d.id}>{d.name || 'ohne Namen'}</option>{/each}
            </select>
          {/if}{@render del(s)}</div>
      {/if}
    </div>
  {/each}
  {@render gap(list.length)}
</div>

<style>
  .list { min-width: 0; }
  .slot { height: 12px; border-radius: 4px; margin: 0; }
  .slot.empty { height: 30px; }
  .slot.hot { background: repeating-linear-gradient(90deg, var(--accent) 0 6px, transparent 6px 12px) center / 100% 2px no-repeat; cursor: pointer; }
  .slot.hot.empty { border: 2px dashed var(--accent); background: none; }
  .slot.over { background: var(--accent); opacity: .35; }
  .slot:focus-visible { outline: 3px solid var(--accent); }
  .blk { --c: var(--blk-motion); background: var(--c); color: #fff; border-radius: 8px; box-shadow: 0 2px 0 rgba(0,0,0,.25); font-weight: 650; font-size: .95rem; }
  .blk.move, .blk.left, .blk.right { --c: var(--blk-motion); }
  .blk.repeat, .blk.while, .blk.if, .blk.ifelse { --c: var(--blk-control); }
  .blk.set, .blk.change { --c: var(--blk-vars); }
  .blk.call { --c: var(--blk-my); }
  .blk.active { outline: 4px solid #ffd54a; outline-offset: 1px; }
  .row { display: flex; align-items: center; gap: .4rem; padding: .4rem .5rem; flex-wrap: wrap; min-height: 2.3rem; }
  .row.mid { padding-top: .25rem; padding-bottom: .25rem; }
  .row span { white-space: nowrap; }
  .grip { cursor: grab; opacity: .8; padding: 0 .15rem; user-select: none; }
  .x { margin-left: auto; background: rgba(0,0,0,.2); color: #fff; border: 0; border-radius: 6px; width: 1.5rem; height: 1.5rem; cursor: pointer; padding: 0; }
  .x:hover { background: rgba(0,0,0,.4); }
  .inner { margin-left: 1.1rem; padding: 0 .4rem 0 .5rem; background: rgba(255,255,255,.9); color: var(--ink); border-left: 0; min-height: 1.5rem; border-radius: 0 0 0 0; }
  .foot { height: .6rem; }
  select { border: 0; border-radius: 12px; padding: .15rem .35rem; background: #fff; color: var(--ink); font: inherit; font-weight: 600; }
  .ro-pill { background: #fff; color: var(--ink); border-radius: 12px; padding: 0 .6rem; font-weight: 700; }
</style>
