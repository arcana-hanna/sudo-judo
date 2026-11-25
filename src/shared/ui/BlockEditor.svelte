<script lang="ts">
  import { dnd } from './dnd.svelte';
  import BlockList from './BlockList.svelte';
  import { removeById } from '../robot/tree';
  import { uid, type Program, type StmtType } from '../types';

  let { program = $bindable(), allowed, vars, readonly = false, activeId = '' }:
    { program: Program; allowed: StmtType[]; vars: string[]; readonly?: boolean; activeId?: string } = $props();

  const groups: { name: string; color: string; items: [StmtType, string][] }[] = [
    { name: 'Bewegung', color: 'var(--blk-motion)', items: [['move', 'vorwärts'], ['left', 'links drehen'], ['right', 'rechts drehen']] },
    { name: 'Steuerung', color: 'var(--blk-control)', items: [['repeat', 'wiederhole …mal'], ['if', 'falls … dann'], ['ifelse', 'falls … sonst'], ['while', 'wiederhole solange']] },
    { name: 'Variablen', color: 'var(--blk-vars)', items: [['set', 'setze … auf'], ['change', 'ändere … um']] },
    { name: 'Eigene Blöcke', color: 'var(--blk-my)', items: [['call', 'Aufruf']] },
  ];
  const shown = $derived(groups
    .map((g) => ({ ...g, items: g.items.filter(([t]) => allowed.includes(t) && (t !== 'set' && t !== 'change' || vars.length > 0)) }))
    .filter((g) => g.items.length));

  const arm = (t: StmtType) => (dnd.armed = dnd.armed === t ? '' : t);
  const addDef = () => program.defs.push({ id: uid(), name: 'Block ' + (program.defs.length + 1), body: [] });
  function removeDef(id: string) {
    program.defs = program.defs.filter((d) => d.id !== id);
    const strip = (list: any[]) => { for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].t === 'call' && list[i].f === id) list.splice(i, 1);
      else for (const k of ['body', 'then', 'else']) if (Array.isArray(list[i][k])) strip(list[i][k]);
    } };
    strip(program.main); program.defs.forEach((d) => strip(d.body));
  }
  function dropOnPalette(e: DragEvent) {
    e.preventDefault();
    if (dnd.drag?.kind === 'move') removeById(program, dnd.drag.id);
    dnd.drag = null;
  }
  // Abbruch: Escape hebt die Auswahl auf.
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dnd.armed = ''; };
</script>

<svelte:window onkeydown={onKey} />

<div class="be" class:ro={readonly}>
  {#if !readonly}
    <aside class="palette" ondragover={(e) => e.preventDefault()} ondrop={dropOnPalette} aria-label="Blöcke">
      <p class="tip">Ziehe einen Block ins Skript – oder wähle ihn aus und klicke auf einen freien Platz. Zum Löschen zurück in diese Spalte ziehen.</p>
      {#each shown as g (g.name)}
        <h4>{g.name}</h4>
        {#each g.items as [t, label] (t)}
          <button class="pal" style="--c:{g.color}" class:armed={dnd.armed === t} aria-pressed={dnd.armed === t}
            draggable="true" ondragstart={() => (dnd.drag = { kind: 'new', t })} ondragend={() => (dnd.drag = null)}
            onclick={() => arm(t)}>{label}</button>
        {/each}
        {#if g.name === 'Eigene Blöcke'}<button class="small" onclick={addDef}>+ Neuer eigener Block</button>{/if}
      {/each}
    </aside>
  {/if}

  <div class="work">
    <div class="script">
      <div class="hat">Wenn ▶ gestartet</div>
      <BlockList list={program.main} {program} {vars} {readonly} {activeId} />
    </div>
    {#each program.defs as d (d.id)}
      <div class="script def">
        <div class="hat my">
          Definiere
          {#if readonly}<strong>{d.name}</strong>{:else}
            <input bind:value={d.name} aria-label="Name des Blocks" />
            <button class="x" onclick={() => removeDef(d.id)} aria-label="Eigenen Block löschen">✕</button>
          {/if}
        </div>
        <BlockList list={d.body} {program} {vars} {readonly} {activeId} />
      </div>
    {/each}
  </div>
</div>

<style>
  .be { display: grid; grid-template-columns: 11.5rem 1fr; gap: .75rem; align-items: start; }
  .be.ro { grid-template-columns: 1fr; }
  .palette { background: var(--wash); border: 2px solid var(--line); border-radius: var(--radius); padding: .6rem; position: sticky; top: .5rem; }
  .tip { font-size: .8rem; color: var(--muted); margin: 0 0 .4rem; }
  h4 { margin: .6rem 0 .25rem; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
  .pal { display: block; width: 100%; text-align: left; margin: 0 0 .3rem; padding: .4rem .6rem; border: 0; border-radius: 8px;
         background: var(--c); color: #fff; font-weight: 650; font-size: .9rem; cursor: grab; box-shadow: 0 2px 0 rgba(0,0,0,.25); }
  .pal.armed { outline: 4px solid #ffd54a; outline-offset: 1px; }
  .small { padding: .3rem .5rem; font-size: .8rem; border: 2px solid var(--line); border-radius: var(--radius); background: var(--paper); cursor: pointer; font-weight: 600; }
  .work { display: grid; gap: 1rem; min-width: 0; }
  .script { background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius); padding: .6rem .75rem .8rem; min-height: 5rem; }
  .hat { display: inline-flex; align-items: center; gap: .5rem; background: var(--blk-hat); color: var(--blk-hat-ink); font-weight: 700; padding: .3rem .8rem;
         border-radius: 14px 14px 8px 8px; margin-bottom: .2rem; }
  .hat.my { background: var(--blk-my); color: #fff; }
  .hat input { border: 0; border-radius: 10px; padding: .1rem .5rem; font: inherit; width: 9rem; }
  .x { background: rgba(0,0,0,.25); color: #fff; border: 0; border-radius: 6px; width: 1.5rem; height: 1.5rem; cursor: pointer; }
  @media (max-width: 40rem) { .be { grid-template-columns: 1fr; } .palette { position: static; } }
</style>
