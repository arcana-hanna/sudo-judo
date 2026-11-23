<script lang="ts">
  import type { Slot, SlotsBlock, Token } from '../../shared/types';
  let { block, solved = false, onsolved }:
    { block: SlotsBlock; solved?: boolean; onsolved?: () => void } = $props();

  let placed = $state<Record<string, string>>({});   // Platz -> Karte
  let sel = $state('');                              // in der Ablage gewählte Karte
  let drag = $state<{ tid: string; from: string } | null>(null);
  let result = $state<'idle' | 'ok' | 'no'>('idle');

  const tok = (id: string) => block.tokens.find((t) => t.id === id);
  const cap = (t: Token) => (t.count === 0 ? Infinity : t.count ?? 1);
  const used = (tid: string) => Object.values(placed).filter((x) => x === tid).length;
  const left = (t: Token) => cap(t) - used(t.id);
  const allFilled = $derived(block.slots.every((s) => placed[s.id]));
  const anyLeft = $derived(block.tokens.some((t) => left(t) > 0));
  const parts = $derived(block.text.split('___'));
  const dropdown = $derived(block.input === 'dropdown');
  const nInline = $derived(Math.max(0, parts.length - 1));

  $effect(() => {
    if (solved) { placed = Object.fromEntries(block.slots.map((s) => [s.id, s.accept[0]])); sel = ''; result = 'ok'; }
  });

  function put(slotId: string, tid: string) {
    if (solved) return;
    const t = tok(tid);
    if (!tid) delete placed[slotId];
    else if (t && (placed[slotId] === tid || left(t) > 0)) placed[slotId] = tid;
    else return;
    sel = ''; result = 'idle';
  }
  function dropOn(slotId: string) {
    if (!drag) return;
    const { tid, from } = drag;
    drag = null;
    if (from === slotId) return;
    const prev = from ? placed[from] : undefined;
    if (from) delete placed[from];
    const before = placed[slotId];
    put(slotId, tid);
    if (placed[slotId] !== tid && from && prev) placed[from] = prev;           // Ablegen nicht möglich: zurück
    else if (from && before) placed[from] = before;                           // belegten Platz tauschen
  }
  function slotClick(s: Slot) {
    if (solved) return;
    if (sel) put(s.id, sel);
    else if (placed[s.id]) put(s.id, '');
  }
  function check() {
    const ok = block.slots.every((s) => s.accept.includes(placed[s.id]));
    result = ok ? 'ok' : 'no';
    if (ok) onsolved?.();
  }
  const name = (t: Token | undefined) => t?.text || 'Bildkarte';
</script>

{#snippet chip(t: Token | undefined)}
  {#if t?.img}<img class="timg" src={t.img} alt="" />{/if}<span>{t?.text ?? ''}</span>
{/snippet}

{#snippet slotEl(s: Slot, i: number)}
  {#if dropdown}
    <select class="dd" aria-label={s.label || `Lücke ${i + 1}`} value={placed[s.id] ?? ''} disabled={solved}
      onchange={(e) => put(s.id, e.currentTarget.value)}>
      <option value="">…</option>
      {#each block.tokens as t (t.id)}
        {#if left(t) > 0 || placed[s.id] === t.id}<option value={t.id}>{t.text || 'Bild'}</option>{/if}
      {/each}
    </select>
  {:else}
    <button class="slot" class:filled={!!placed[s.id]} class:hot={!!sel && !solved} disabled={solved}
      aria-label="{s.label || `Platz ${i + 1}`}: {placed[s.id] ? name(tok(placed[s.id])) + ' (zum Zurücklegen anklicken)' : 'leer'}"
      draggable={!!placed[s.id] && !solved}
      ondragstart={() => (drag = { tid: placed[s.id], from: s.id })} ondragend={() => (drag = null)}
      ondragover={(e) => e.preventDefault()} ondrop={(e) => { e.preventDefault(); dropOn(s.id); }}
      onclick={() => slotClick(s)}>
      {#if placed[s.id]}{@render chip(tok(placed[s.id]))}{:else}<span class="ph">{block.layout === 'list' ? '…' : i + 1}</span>{/if}
    </button>
  {/if}
{/snippet}

<fieldset class="ex" class:solved>
  <legend>{block.question}</legend>
  {#if !solved}
    <p class="note">{dropdown ? 'Wähle in jeder Lücke die passende Antwort aus.'
      : 'Wähle eine Karte und klicke auf einen Platz – oder ziehe die Karte dorthin. Ein Klick auf eine belegte Stelle legt die Karte zurück.'}</p>
  {/if}

  {#if block.layout === 'image'}
    <div class="stage">
      <img class="bgimg" src={block.bg} alt={block.bgAlt} />
      {#each block.slots as s, i (s.id)}
        <div class="abs" style="left:{s.x}%;top:{s.y}%">{@render slotEl(s, i)}</div>
      {/each}
    </div>
  {:else if block.layout === 'text'}
    <p class="cloze">
      {#each parts as part, i (i)}{part}{#if i < nInline && block.slots[i]}{@render slotEl(block.slots[i], i)}{/if}{/each}
    </p>
    {#if block.slots.length > nInline}
      <div class="list">{#each block.slots.slice(nInline) as s, k (s.id)}
        <div class="li"><span class="lab">{s.label}</span>{@render slotEl(s, nInline + k)}</div>{/each}</div>
    {/if}
  {:else}
    <div class="list">
      {#each block.slots as s, i (s.id)}
        <div class="li"><span class="lab">{s.label}</span>{@render slotEl(s, i)}</div>
      {/each}
    </div>
  {/if}

  {#if !dropdown}
    <div class="pool" role="group" aria-label="Karten" ondragover={(e) => e.preventDefault()}
      ondrop={(e) => { e.preventDefault(); if (drag?.from) put(drag.from, ''); drag = null; }}>
      {#each block.tokens as t (t.id)}
        {#if left(t) > 0}
          <button class="chip" class:sel={sel === t.id} aria-pressed={sel === t.id} disabled={solved}
            draggable={!solved} ondragstart={() => (drag = { tid: t.id, from: '' })} ondragend={() => (drag = null)}
            onclick={() => (sel = sel === t.id ? '' : t.id)} aria-label={name(t)}>
            {@render chip(t)}{#if cap(t) !== 1 && cap(t) !== Infinity}<small>×{left(t)}</small>{/if}
          </button>
        {/if}
      {/each}
      {#if !anyLeft && !solved}<span class="empty">Alle Karten sind verteilt.</span>{/if}
    </div>
  {/if}

  <div class="row">
    <button class="check" onclick={check} disabled={solved || !allFilled}>Prüfen</button>
    <p class="msg" role="status">
      {#if result === 'ok'}<span class="ok">Richtig!</span>
      {:else if result === 'no'}<span class="no">Noch nicht ganz.</span>
        {#if block.hint}<span>Tipp: {block.hint}</span>{/if}
      {/if}
    </p>
  </div>
</fieldset>

<style>
  .ex { border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem 1.25rem 1.25rem; margin: 0 0 1.5rem; min-width: 0; }
  .ex.solved { border-color: var(--good); }
  legend { font-weight: 650; font-size: 1.15rem; padding: 0 .5rem; margin-left: -.5rem; max-width: 60ch; }
  .note { color: var(--muted); margin: 0 0 .75rem; font-size: .95rem; }
  .stage { position: relative; margin-bottom: 1rem; }
  .bgimg { display: block; width: 100%; height: auto; border-radius: var(--radius); border: 2px solid var(--line); }
  .abs { position: absolute; transform: translate(-50%, -50%); }
  .cloze { line-height: 2.6; margin: 0 0 1rem; max-width: 60ch; }
  .list { display: flex; flex-wrap: wrap; gap: .75rem 1.25rem; margin-bottom: 1rem; }
  .li { display: grid; gap: .2rem; justify-items: start; }
  .lab { font-size: .9rem; color: var(--muted); }
  .slot { min-width: 3.4rem; min-height: 2.7rem; padding: .25rem .6rem; border: 2px dashed var(--accent); border-radius: var(--radius); background: rgba(255, 255, 255, .92); cursor: pointer; font-size: 1rem; display: inline-flex; align-items: center; gap: .3rem; vertical-align: middle; }
  .slot.filled { border-style: solid; background: var(--paper); }
  .slot.hot:not(.filled) { background: var(--wash); border-width: 3px; }
  .slot:disabled { cursor: default; color: var(--ink); }
  .ph { color: var(--muted); font-size: .85rem; }
  .dd { padding: .35rem .5rem; border: 2px solid var(--accent); border-radius: var(--radius); background: var(--paper); font: inherit; min-width: 6rem; vertical-align: middle; }
  .pool { display: flex; flex-wrap: wrap; gap: .5rem; min-height: 3.2rem; padding: .6rem; background: var(--wash); border-radius: var(--radius); }
  .chip { display: inline-flex; align-items: center; gap: .35rem; padding: .45rem .8rem; background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius); cursor: grab; font-size: 1rem; }
  .chip:hover:not(:disabled) { border-color: var(--accent); }
  .chip.sel { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
  .chip small { opacity: .8; font-weight: 700; }
  .timg { height: 2.2rem; width: auto; max-width: 4.5rem; object-fit: contain; }
  .empty { color: var(--muted); align-self: center; }
  .row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
  .check { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: var(--radius); padding: .6rem 1.4rem; font-weight: 650; cursor: pointer; }
  .check:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .msg { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
  .ok { color: var(--good); font-weight: 650; }
  .no { color: var(--bad); font-weight: 650; }
</style>
