<script lang="ts">
  import { uid, type Slot, type SlotsBlock, type Token } from '../../shared/types';
  import Steps from '../ui/Steps.svelte';
  import Seg from '../ui/Seg.svelte';
  import Inline from '../ui/Inline.svelte';
  import ImgField from '../ImgField.svelte';
  let { block = $bindable() }: { block: SlotsBlock } = $props();

  let step = $state<'build' | 'solve'>('build');
  let boardEl: HTMLDivElement | undefined = $state();
  let adding = $state(false);
  let selSlot = $state('');
  let dragSlot = '';
  let sel = $state('');           // Lösung vormachen: gewählte Karte
  let dragTok = $state('');
  let newTok = $state('');

  const selIndex = $derived(block.slots.findIndex((s) => s.id === selSlot));
  $effect(() => { if (block.bg === undefined) block.bg = ''; });
  const holes = $derived((block.text.match(/___/g) ?? []).length);
  const parts = $derived(block.text.split('___'));
  const countOpts: [number, string][] = [[1, '1×'], [2, '2×'], [3, '3×'], [4, '4×'], [0, '∞']];
  const tName = (t: Token | undefined) => t?.text || 'Bildkarte';
  const tok = (id: string) => block.tokens.find((t) => t.id === id);

  // Lückentext: die Plätze folgen automatisch der Zahl der Lücken (___).
  $effect(() => {
    if (block.layout !== 'text' || block.text.trim() === '') return;
    const n = holes;
    if (block.slots.length < n) for (let i = block.slots.length; i < n; i++) block.slots.push({ id: uid(), label: '', x: 50, y: 50, accept: [] });
    else if (block.slots.length > n) block.slots.splice(n);
  });
  function setLayout(l: SlotsBlock['layout']) {
    block.layout = l;
    if (l === 'text' && block.text.trim() === '' && block.slots.length) block.text = block.slots.map(() => '___').join(' ');
  }

  function addToken() { const t = { id: uid(), text: '' }; block.tokens.push(t); newTok = t.id; }
  function removeToken(i: number) {
    const [gone] = block.tokens.splice(i, 1);
    for (const s of block.slots) s.accept = s.accept.filter((t) => t !== gone.id);
    if (sel === gone.id) sel = '';
  }
  function addSlot(x = 50, y = 50) { const s: Slot = { id: uid(), label: '', x, y, accept: [] }; block.slots.push(s); selSlot = s.id; }

  const pct = (e: { clientX: number; clientY: number }) => {
    const r = boardEl!.getBoundingClientRect();
    const c = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10) / 10));
    return { x: c(((e.clientX - r.left) / r.width) * 100), y: c(((e.clientY - r.top) / r.height) * 100) };
  };
  function boardClick(e: MouseEvent) {
    if (!adding || (e.target as HTMLElement).closest('.mk')) return;
    const p = pct(e); addSlot(p.x, p.y); adding = false;
  }
  function down(e: PointerEvent, s: Slot) { dragSlot = s.id; selSlot = s.id; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }
  function move(e: PointerEvent, s: Slot) { if (dragSlot !== s.id) return; const p = pct(e); s.x = p.x; s.y = p.y; }
  const up = () => (dragSlot = '');

  // Lösung vormachen
  function put(s: Slot, tid = sel) { if (tid && !s.accept.includes(tid)) s.accept.push(tid); }
  function unput(s: Slot, tid: string) { s.accept = s.accept.filter((t) => t !== tid); }
</script>

{#snippet chipBody(t: Token | undefined)}{#if t?.img}<img class="timg" src={t.img} alt="" />{/if}<span>{t?.text ?? ''}</span>{/snippet}

{#snippet slotBox(s: Slot, i: number)}
  <div class="sbox" class:filled={s.accept.length > 0} role="group" aria-label="{s.label || `Platz ${i + 1}`}"
    ondragover={(e) => { if (dragTok) e.preventDefault(); }} ondrop={(e) => { e.preventDefault(); put(s, dragTok); dragTok = ''; }}>
    {#each s.accept as tid (tid)}
      <button class="acc" onclick={() => unput(s, tid)} title="Karte aus diesem Platz entfernen"
        aria-label="{tName(tok(tid))} aus Platz {i + 1} entfernen">{@render chipBody(tok(tid))}</button>
    {/each}
    <button class="addhere" disabled={!sel} onclick={() => put(s)} aria-label="Gewählte Karte in Platz {i + 1} setzen">{s.accept.length ? '+' : block.layout === 'list' ? '…' : i + 1}</button>
  </div>
{/snippet}

<Steps bind:step />

{#if step === 'build'}
  <div class="set">
    <span class="lab">Plätze</span>
    <Seg label="Wo stehen die Plätze?" value={block.layout} onchange={setLayout}
      options={[{ value: 'list', label: 'Liste' }, { value: 'text', label: 'Lückentext' }, { value: 'image', label: 'Auf einem Bild' }]} />
    <span class="lab">Eingabe</span>
    <Seg label="Wie füllen die Schüler sie?" value={block.input} onchange={(v) => (block.input = v)}
      options={[{ value: 'drag', label: 'Karten setzen' }, { value: 'dropdown', label: 'Auswahlliste' }]} />
  </div>

  <p class="cap">Karten{block.input === 'dropdown' ? ' (in der Auswahlliste erscheint nur der Text)' : ' – die Schüler setzen sie in die Plätze'}</p>
  <div class="tokens">
    {#each block.tokens as t, i (t.id)}
      <span class="tchip">
        {#if t.img}<img class="timg" src={t.img} alt="" />{/if}
        <Inline fit={4} bind:value={t.text} placeholder="Karte {i + 1}" label="Karte {i + 1}" autofocus={t.id === newTok} />
        <span class="tools">
          <select aria-label="Wie oft verfügbar?" value={t.count ?? 1} onchange={(e) => (t.count = +e.currentTarget.value)} title="Wie oft darf die Karte benutzt werden?">
            {#each countOpts as [v, l]}<option value={v}>{l}</option>{/each}
          </select>
          <ImgField bind:value={t.img} label="Bild" compact />
          <button class="x" onclick={() => removeToken(i)} aria-label="Karte {i + 1} löschen">✕</button>
        </span>
      </span>
    {/each}
    <button class="addtok" onclick={addToken}>+ Karte</button>
  </div>

  {#if block.layout === 'list'}
    <p class="cap">Plätze</p>
    {#each block.slots as s, i (s.id)}
      <div class="srow">
        <span class="num">{i + 1}</span>
        <Inline bind:value={s.label} placeholder="Beschriftung des Platzes" label="Beschriftung von Platz {i + 1}" />
        <button class="x" onclick={() => block.slots.splice(i, 1)} aria-label="Platz {i + 1} löschen">✕</button>
      </div>
    {/each}
    <button class="addtok" onclick={() => addSlot()}>+ Platz</button>
  {:else if block.layout === 'text'}
    <p class="cap">Text – schreibe ___ (drei Unterstriche) für jede Lücke. Die Plätze entstehen automatisch.</p>
    <Inline multiline bind:value={block.text} cls="para" placeholder="z. B. Die Maus ist ein ___gerät." label="Text mit Lücken" />
    <p class="cap">{holes} {holes === 1 ? 'Lücke' : 'Lücken'}</p>
  {:else}
    <p class="cap">Hintergrundbild</p>
    <div class="bgrow"><ImgField bind:value={block.bg} max={900} label="Hintergrundbild wählen" removeLabel="Hintergrundbild entfernen" /></div>
    {#if block.bg}
      <label class="alt"><span>Bildbeschreibung für Screenreader:</span>
        <Inline bind:value={block.bgAlt} placeholder="z. B. Zeichnung eines Computers" label="Beschreibung des Hintergrundbilds" /></label>
      <div class="bgrow">
        <button class="small" class:on={adding} aria-pressed={adding} onclick={() => (adding = !adding)}>{adding ? 'Klicke jetzt auf das Bild …' : '+ Platz auf dem Bild setzen'}</button>
        {#if selIndex >= 0}<button class="small danger" onclick={() => block.slots.splice(selIndex, 1)}>Platz {selIndex + 1} löschen</button>{/if}
        <small>Plätze lassen sich mit der Maus verschieben; zum Löschen erst anklicken.</small>
      </div>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="stage" class:adding bind:this={boardEl} onclick={boardClick}>
        <img src={block.bg} alt={block.bgAlt} draggable="false" />
        {#each block.slots as s, i (s.id)}
          <button class="mk" class:sel={selSlot === s.id} style="left:{s.x}%;top:{s.y}%" aria-label="Platz {i + 1} verschieben"
            onpointerdown={(e) => down(e, s)} onpointermove={(e) => move(e, s)} onpointerup={up} onclick={() => (selSlot = s.id)}>{i + 1}</button>
        {/each}
      </div>
    {/if}
  {/if}
{:else}
  <p class="cap">Wähle eine Karte und klicke auf den Platz, in den sie gehört – wie ein Schüler. Pro Platz sind mehrere richtige Karten möglich. Ein Klick auf eine gesetzte Karte entfernt sie.</p>
  <div class="pool" role="group" aria-label="Karten">
    {#each block.tokens as t (t.id)}
      <button class="chip" class:sel={sel === t.id} aria-pressed={sel === t.id} draggable="true"
        ondragstart={() => (dragTok = t.id)} ondragend={() => (dragTok = '')} onclick={() => (sel = sel === t.id ? '' : t.id)}>{@render chipBody(t)}</button>
    {/each}
  </div>

  {#if block.layout === 'image' && block.bg}
    <div class="stage solve"><img src={block.bg} alt={block.bgAlt} draggable="false" />
      {#each block.slots as s, i (s.id)}<div class="abs" style="left:{s.x}%;top:{s.y}%">{@render slotBox(s, i)}</div>{/each}</div>
  {:else if block.layout === 'text'}
    <p class="cloze">{#each parts as part, i (i)}{part}{#if i < parts.length - 1 && block.slots[i]}{@render slotBox(block.slots[i], i)}{/if}{/each}</p>
  {:else}
    <div class="list">{#each block.slots as s, i (s.id)}<div class="li"><span class="slab">{s.label}</span>{@render slotBox(s, i)}</div>{/each}</div>
  {/if}
  {#if block.slots.length === 0}<p class="warn">Es gibt noch keine Plätze – lege sie im Schritt „Aufgabe aufbauen“ an.</p>{/if}
{/if}

<style>
  .cap { margin: .3rem 0 .5rem; font-size: .9rem; color: var(--muted); }
  .lab { color: var(--muted); font-size: .9rem; }
  .set { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; margin-bottom: .4rem; }
  .tokens, .pool { display: flex; flex-wrap: wrap; gap: .5rem; padding: .6rem; background: var(--wash); border-radius: var(--radius); align-items: center; }
  .tchip { position: relative; display: inline-flex; align-items: center; gap: .3rem; padding: .15rem .5rem; border: 2px solid var(--line); border-radius: var(--radius); background: var(--paper); }
  .tchip :global(.inl) { width: auto; min-width: 4rem; field-sizing: content; }
  .timg { height: 2rem; width: auto; max-width: 4rem; object-fit: contain; }
  .tools { position: absolute; top: -2rem; left: 0; z-index: 4; display: inline-flex; gap: .2rem; align-items: center; padding: .15rem .3rem; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 2px 10px rgba(28, 43, 51, .15); opacity: 0; pointer-events: none; transition: opacity .12s; white-space: nowrap; }
  .tchip:hover .tools, .tchip:focus-within .tools { opacity: 1; pointer-events: auto; }
  @media (hover: none) { .tools { position: static; opacity: 1; pointer-events: auto; box-shadow: none; border: 0; padding: 0; } }
  .tools select { padding: .15rem .2rem; border: 2px solid var(--line); border-radius: 6px; background: var(--paper); font-size: .85rem; }
  .x { background: none; border: 0; color: var(--muted); cursor: pointer; padding: .2rem .4rem; border-radius: 6px; }
  .x:hover:not(:disabled) { background: var(--bad-wash); color: var(--bad); }
  .addtok { border: 2px dashed var(--line) !important; background: none !important; color: var(--muted); }
  .addtok:hover { color: var(--accent); border-color: var(--accent) !important; }
  .srow { display: flex; align-items: center; gap: .5rem; margin-bottom: .3rem; }
  .num { width: 1.4rem; text-align: right; color: var(--muted); }
  .bgrow { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; margin: .3rem 0; }
  .alt { display: flex; gap: .5rem; align-items: center; margin: .3rem 0; font-size: .92rem; } .alt span { color: var(--muted); white-space: nowrap; }
  .stage { position: relative; max-width: 640px; border: 2px solid var(--line); border-radius: var(--radius); margin: .4rem 0; }
  .stage.adding { cursor: crosshair; outline: 3px dashed var(--accent); }
  .stage img { display: block; width: 100%; height: auto; user-select: none; }
  .abs { position: absolute; transform: translate(-50%, -50%); }
  .mk { position: absolute; transform: translate(-50%, -50%); width: 2.2rem; height: 2.2rem; padding: 0 !important; border-radius: 50% !important; border: 3px dashed var(--accent) !important; background: rgba(255,255,255,.9) !important; font-weight: 700; cursor: grab; touch-action: none; }
  .mk.sel { background: var(--accent) !important; color: var(--accent-ink); border-style: solid !important; }
  .chip { display: inline-flex; align-items: center; gap: .35rem; padding: .45rem .8rem; background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius); cursor: pointer; font-size: 1rem; }
  .chip.sel { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
  .cloze { line-height: 2.8; margin: .8rem 0; max-width: 60ch; }
  .list { display: flex; flex-wrap: wrap; gap: .75rem 1.25rem; margin: .8rem 0; }
  .li { display: grid; gap: .2rem; } .slab { font-size: .9rem; color: var(--muted); }
  .sbox { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .3rem; min-width: 3.4rem; min-height: 2.7rem; padding: .2rem .4rem; border: 2px dashed var(--accent); border-radius: var(--radius); background: rgba(255,255,255,.92); vertical-align: middle; }
  .sbox.filled { border-style: solid; }
  .acc { padding: .15rem .5rem !important; border-width: 2px !important; font-weight: 600 !important; font-size: .95rem; display: inline-flex; gap: .3rem; align-items: center; background: var(--good-wash) !important; border-color: var(--good) !important; }
  .acc:hover { background: var(--bad-wash) !important; border-color: var(--bad) !important; }
  .addhere { border: 0 !important; background: none !important; color: var(--muted); padding: .1rem .4rem !important; font-size: .9rem; }
  .addhere:not(:disabled):hover { color: var(--accent); }
  .warn { color: var(--bad); margin: .35rem 0 0; font-size: .9rem; }
  small { color: var(--muted); }
</style>
