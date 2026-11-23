<script lang="ts">
  import { tick } from 'svelte';
  import Player from '../player/Player.svelte';
  import { app, hist, saveDraft, commit, undo, redo, setProject, addPage, movePage, deletePage,
           duplicatePage, duplicateBlock, newProject, markSaved } from './state.svelte';
  import { validate, type Issue } from '../shared/validate';
  import { editorBlocks } from './registry';
  import { templates, type Template } from './templates';
  import { icons } from './icons';
  import { download, readProject } from './io';
  import Help from './Help.svelte';
  import Menu from './ui/Menu.svelte';
  import Picker from './ui/Picker.svelte';
  import BlockCard from './ui/BlockCard.svelte';

  const page = $derived(app.project.pages.find((p) => p.id === app.pageId));
  let message = $state('');
  let fileInput: HTMLInputElement;
  let galleryDlg: HTMLDialogElement;
  let helpDlg: HTMLDialogElement;
  let pickerDlg: HTMLDialogElement;
  let pickerIndex = 0;
  let showIssues = $state(false);
  let dragBlock = $state(-1);
  let overBlock = $state(-1);
  let dragPage = $state(-1);
  let overPage = $state(-1);

  const issues = $derived(validate(app.project));
  const issuePages = $derived(
    [...new Set(issues.map((i) => i.pageId))].map((id) => ({ id, items: issues.filter((i) => i.pageId === id) })));
  const hintsFor = (blockId: string) => issues.filter((i) => i.blockId === blockId).map((i) => i.message);
  const pageHints = $derived(issues.filter((i) => i.pageId === app.pageId && i.blockId === null).map((i) => i.message));
  const kinds = (p: { blocks: { type: string }[] }) => [...new Set(p.blocks.map((b) => b.type))].filter((t) => icons[t]);

  // Entwurf automatisch im Browser sichern.
  $effect(() => {
    app.dirty = JSON.stringify(app.project) !== app.saved;
    const t = setTimeout(() => { commit(); saveDraft(); }, 500);
    return () => clearTimeout(t);
  });

  function onKey(e: KeyboardEvent) {
    const el = e.target as HTMLElement;
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); onExport(); return; }
    if (el.closest('input, textarea')) return;       // in Textfeldern gilt das normale Rückgängig
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
  }
  function flash(msg: string) { message = msg; setTimeout(() => (message = ''), 4000); }

  async function onOpen(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const p = readProject(await file.text());
      if (confirm(`„${p.title}“ öffnen? Das aktuelle Projekt wird ersetzt.`)) setProject(p);
    } catch (err) { flash((err as Error).message); }
  }
  function onExport() {
    if (issues.length && !confirm(`Es gibt noch ${issues.length} ${issues.length === 1 ? 'Hinweis' : 'Hinweise'} (siehe „Hinweise“ oben). Trotzdem weitergeben?`)) {
      showIssues = true; return;
    }
    try { download(app.project); markSaved(); } catch (err) { flash((err as Error).message); }
  }
  function onNew() {
    if (confirm('Neues Projekt beginnen? Das aktuelle Projekt wird aus dem Editor entfernt – gib es vorher weiter, wenn du es behalten möchtest.')) newProject();
  }
  function onUnload(e: BeforeUnloadEvent) { if (app.dirty && !app.storageOk) { e.preventDefault(); e.returnValue = ''; } }

  function addFrom(t: Template | null) {
    addPage(t ? t.make(t.name) : undefined);
    app.preview = false; galleryDlg.close();
  }
  function select(id: string) { app.pageId = id; app.preview = false; }
  function onDeletePage() { if (confirm(`Seite „${page?.title}“ löschen?`)) deletePage(); }
  function movePageTo(from: number, to: number) {
    const ps = app.project.pages;
    if (from < 0 || from === to || to < 0 || to >= ps.length) return;
    ps.splice(to, 0, ps.splice(from, 1)[0]);
  }
  const pageMenu = (id: string, i: number) => [
    { label: 'Seite duplizieren', onclick: () => { app.pageId = id; duplicatePage(); } },
    { label: 'Nach oben', onclick: () => movePageTo(i, i - 1), disabled: i === 0 },
    { label: 'Nach unten', onclick: () => movePageTo(i, i + 1), disabled: i === app.project.pages.length - 1 },
    { label: 'Seite löschen', onclick: () => { app.pageId = id; onDeletePage(); }, danger: true },
  ];

  // ---- Blöcke ----
  function openPicker(i: number) { pickerIndex = i; pickerDlg.showModal(); }
  async function pickBlock(type: string) {
    if (!page) return;
    const b = editorBlocks[type].create();
    page.blocks.splice(pickerIndex, 0, b);
    await tick();
    const el = document.getElementById('blk-' + b.id);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    (el?.querySelector('textarea, input:not([type=file])') as HTMLElement | null)?.focus();
  }
  function moveBlock(from: number, to: number) {
    const bs = page!.blocks;
    if (from < 0 || from === to || to < 0 || to >= bs.length) return;
    bs.splice(to, 0, bs.splice(from, 1)[0]);
  }
  function dropBlock(i: number) {
    if (dragBlock < 0) return;
    moveBlock(dragBlock, dragBlock < i ? i - 1 : i);
    dragBlock = -1; overBlock = -1;
  }
  function deleteBlock(i: number) {
    const b = page!.blocks[i];
    const filled = JSON.stringify(b).length > 400;
    if (!filled || confirm('Diesen Block löschen?')) page!.blocks.splice(i, 1);
  }
  async function gotoIssue(i: Issue) {
    if (app.project.pages.some((p) => p.id === i.pageId)) app.pageId = i.pageId;
    app.preview = false;
    await tick();
    document.getElementById('blk-' + i.blockId)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
</script>

<svelte:window onkeydown={onKey} onbeforeunload={onUnload} />

<div class="app">
  <header class="top">
    <span class="brand"><span aria-hidden="true">$ </span>Sudo-Judo</span>
    <input class="title" bind:value={app.project.title} aria-label="Titel der Aufgabensammlung" />
    <span class="msg" role="status">{message}</span>
    <span class="sp"></span>
    <button class="ib" onclick={undo} disabled={!hist.canUndo} aria-label="Rückgängig" title="Rückgängig (Strg+Z)">↶</button>
    <button class="ib" onclick={redo} disabled={!hist.canRedo} aria-label="Wiederholen" title="Wiederholen (Strg+Y)">↷</button>
    <button class="chip" class:warn={issues.length > 0} aria-expanded={showIssues} onclick={() => (showIssues = !showIssues)}>
      {#if issues.length}<span class="badge" aria-hidden="true">{issues.length}</span> {issues.length === 1 ? 'Hinweis' : 'Hinweise'}{:else}<span aria-hidden="true">✓</span> Alles fertig{/if}
    </button>
    <button class:on={app.preview} onclick={() => (app.preview = !app.preview)}>{app.preview ? '✎ Weiter bearbeiten' : '▶ Ausprobieren'}</button>
    <button class="primary" onclick={onExport} title="Als eine HTML-Datei speichern (Strg+S)">Weitergeben</button>
    <Menu label="Datei ▾" cls="filemenu" items={[
      { label: 'Neues Projekt …', onclick: onNew },
      { label: 'Öffnen …', onclick: () => fileInput.click() },
      { label: 'Hilfe und Anleitung', onclick: () => helpDlg.showModal() },
    ]} />
    <input bind:this={fileInput} type="file" accept=".html,.json,text/html,application/json" hidden onchange={onOpen} />
  </header>

  {#if !app.storageOk}
    <div class="banner" role="alert">
      Dein Browser erlaubt kein automatisches Speichern (z. B. in einem privaten Fenster). Gib deine Arbeit
      regelmäßig weiter – sonst geht sie beim Schließen verloren.
    </div>
  {/if}

  {#if showIssues}
    <section class="issues" aria-label="Hinweise">
      {#if issues.length === 0}
        <p class="allgood">✓ Alles fertig – keine offenen Hinweise.</p>
      {:else}
        <p class="count">{issues.length} {issues.length === 1 ? 'Hinweis' : 'Hinweise'}. Klicke auf einen Eintrag, um dorthin zu springen.</p>
        <ul>
          {#each issuePages as g (g.id)}
            {#each g.items as i}
              <li><button class="link" onclick={() => gotoIssue(i)}><strong>{i.where}:</strong> {i.message}</button></li>
            {/each}
          {/each}
        </ul>
      {/if}
    </section>
  {/if}

  <div class="body">
    <nav class="pages" aria-label="Seiten">
      <ul>
        {#each app.project.pages as p, i (p.id)}
          <li class:sel={p.id === app.pageId} class:over={overPage === i && dragPage !== i}
            ondragover={(e) => { if (dragPage >= 0) { e.preventDefault(); overPage = i; } }}
            ondrop={(e) => { e.preventDefault(); movePageTo(dragPage, i); dragPage = -1; overPage = -1; }}>
            <span class="grip" draggable="true" role="presentation" title="Zum Umsortieren ziehen"
              ondragstart={(e) => { dragPage = i; e.dataTransfer?.setData('text/plain', 'page'); }} ondragend={() => { dragPage = -1; overPage = -1; }}>⠿</span>
            <button class="pg" aria-current={p.id === app.pageId ? 'page' : undefined} onclick={() => select(p.id)}>
              <span class="pt">{i + 1}. {p.title || 'Ohne Titel'}</span>
              <span class="kinds" aria-hidden="true">{#each kinds(p) as k}<span class="ic">{@html icons[k]}</span>{/each}</span>
            </button>
            <Menu label="⋯" cls="pmenu" title="Seitenaktionen" items={pageMenu(p.id, i)} />
          </li>
        {/each}
      </ul>
      <button class="addpage" onclick={() => galleryDlg.showModal()}>+ Seite</button>
    </nav>

    <main class="work">
      {#if app.preview}
        <div class="stage">
          {#key app.pageId}<Player project={app.project} start={app.pageId} />{/key}
        </div>
      {:else if page}
        <div class="paper">
          <input class="pagetitle" bind:value={page.title} placeholder="Titel der Seite" aria-label="Titel der Seite" />
          {#if pageHints.length}<ul class="phints" role="status">{#each pageHints as m}<li>{m}</li>{/each}</ul>{/if}

          {#each page.blocks as block, i (block.id)}
            <div class="bw" class:over={overBlock === i && dragBlock >= 0}
              ondragover={(e) => { if (dragBlock >= 0) { e.preventDefault(); overBlock = i; } }}
              ondrop={(e) => { e.preventDefault(); dropBlock(i); }}>
              <button class="ins" aria-label="Inhalt vor diesem Block einfügen" title="Hier etwas einfügen" onclick={() => openPicker(i)}><span>+</span></button>
              <BlockCard bind:block={page.blocks[i]} index={i} count={page.blocks.length} issues={hintsFor(block.id)}
                onmove={(d) => moveBlock(i, i + d)} ondup={() => duplicateBlock(page, i)} ondelete={() => deleteBlock(i)}
                ongrab={() => (dragBlock = i)} ongrabend={() => { dragBlock = -1; overBlock = -1; }} />
            </div>
          {/each}

          {#if page.blocks.length === 0}
            <div class="empty"><p>Diese Seite ist noch leer.</p></div>
          {/if}
          <button class="addend" onclick={() => openPicker(page.blocks.length)}>+ Inhalt hinzufügen</button>
        </div>
      {:else}
        <div class="paper"><p class="empty">Noch keine Seite vorhanden. Lege links eine neue Seite an.</p></div>
      {/if}
    </main>
  </div>

  <dialog bind:this={galleryDlg} aria-labelledby="gal-title">
    <h2 id="gal-title">Neue Seite</h2>
    <button class="blank" onclick={() => addFrom(null)}>Leere Seite</button>
    <p class="lead">… oder mit einer fertigen Beispielaufgabe beginnen (du kannst alles ändern):</p>
    <div class="cards">
      {#each templates as t (t.id)}
        <button class="card" onclick={() => addFrom(t)}><strong>{t.name}</strong><span>{t.description}</span></button>
      {/each}
    </div>
    <form method="dialog"><button>Abbrechen</button></form>
  </dialog>

  <Picker bind:dialog={pickerDlg} onpick={pickBlock} />
  <Help bind:dialog={helpDlg} />
</div>

<style>
  .app { display: flex; flex-direction: column; height: 100vh; font-size: 15px; background: var(--wash); }
  .top { display: flex; gap: .5rem; align-items: center; padding: .45rem 1rem; background: var(--paper); border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .brand { font: 700 .95rem ui-monospace, 'Cascadia Code', Consolas, Menlo, monospace; text-transform: lowercase; color: var(--accent); padding-right: .6rem; margin-right: .2rem; border-right: 2px solid var(--line); white-space: nowrap; }
  @media (max-width: 1000px) { .brand { display: none; } }
  .title { font-size: 1.1rem; font-weight: 700; border: 2px solid transparent; background: transparent; padding: .3rem .5rem; border-radius: var(--radius); flex: 1 1 10rem; min-width: 6rem; max-width: 22rem; }
  .title:hover, .title:focus { border-color: var(--line); }
  .msg { color: var(--bad); }
  .sp { flex: 0 1 0; }
  .top button { white-space: nowrap; }
  .ib { border-color: transparent !important; font-size: 1.15rem; padding: .25rem .6rem !important; }
  .chip { border-radius: 999px !important; font-size: .9rem; color: var(--good); border-color: var(--good) !important; background: var(--good-wash) !important; }
  .chip.warn { color: var(--bad); border-color: var(--bad) !important; background: var(--bad-wash) !important; }
  .badge { display: inline-block; min-width: 1.3rem; padding: 0 .35rem; border-radius: 1rem; background: var(--bad); color: #fff; font-size: .8rem; text-align: center; }
  .banner { background: var(--bad-wash); color: var(--bad); padding: .6rem 1rem; font-weight: 600; border-bottom: 2px solid var(--bad); }
  .issues { padding: .6rem 1rem .8rem; border-bottom: 1px solid var(--line); background: var(--paper); max-height: 14rem; overflow: auto; }
  .issues ul { list-style: none; margin: .4rem 0 0; padding: 0; display: grid; gap: .15rem; }
  .issues .count { margin: 0; color: var(--muted); } .allgood { margin: 0; color: var(--good); font-weight: 650; }
  .link { border: 0 !important; background: none !important; padding: .15rem 0 !important; text-align: left; font-weight: 400 !important; color: var(--ink); text-decoration: underline; text-decoration-color: var(--line); text-underline-offset: 3px; }
  .link:hover { text-decoration-color: var(--accent); }

  .body { flex: 1; display: grid; grid-template-columns: 15.5rem 1fr; min-height: 0; }
  .pages { background: var(--paper); border-right: 1px solid var(--line); padding: .75rem .6rem; overflow: auto; display: flex; flex-direction: column; gap: .6rem; }
  .pages ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .3rem; }
  .pages li { display: flex; align-items: center; gap: .15rem; border: 2px solid transparent; border-radius: 8px; padding: .15rem .2rem; }
  .pages li.sel { background: var(--wash); border-color: var(--accent); }
  .pages li.over { border-color: var(--accent); border-style: dashed; }
  .pages .grip { cursor: grab; color: var(--muted); padding: .2rem .15rem; user-select: none; touch-action: none; }
  .pg { flex: 1; text-align: left; border: 0 !important; background: none !important; padding: .35rem .4rem !important; min-width: 0; display: grid; gap: .25rem; }
  .pt { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .kinds { display: flex; gap: .15rem; color: var(--muted); }
  .kinds .ic :global(svg) { width: 16px; height: 16px; }
  .addpage { border-style: dashed !important; color: var(--muted); }
  :global(.pmenu .mbtn) { border: 0 !important; padding: .2rem .5rem !important; font-size: 1.1rem; background: none !important; }

  .work { overflow: auto; padding: 1.5rem 1rem 4rem; }
  .paper { max-width: 50rem; margin: 0 auto; background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 1.75rem 2rem 2rem; font-size: 18px; box-shadow: 0 1px 3px rgba(28, 43, 51, .06); }
  .pagetitle { display: block; width: 100%; font-size: 1.9rem; font-weight: 700; line-height: 1.2; border: 0; border-bottom: 2px solid transparent; background: transparent; padding: .1rem .25rem; margin: 0 0 1rem; font-family: var(--font); color: var(--ink); }
  .pagetitle:hover { border-bottom-color: var(--line); } .pagetitle:focus { outline: none; border-bottom-color: var(--accent); }
  .phints { list-style: none; margin: 0 0 1rem; padding: .5rem .8rem; background: var(--bad-wash); border-left: 4px solid var(--bad); color: var(--bad); font-size: .92rem; border-radius: 4px; }
  .bw { position: relative; padding-top: .35rem; }
  .bw.over { box-shadow: 0 -3px 0 var(--accent); }
  .ins { display: block; width: 100%; height: 1.1rem; padding: 0 !important; border: 0 !important; background: none !important; position: relative; cursor: pointer; opacity: 0; transition: opacity .12s; }
  .ins span { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 1.5rem; height: 1.5rem; border-radius: 50%; background: var(--accent); color: #fff; line-height: 1.4rem; font-weight: 700; font-size: 1.1rem; }
  .ins::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 2px; background: var(--accent); opacity: .35; }
  .ins:hover, .ins:focus-visible { opacity: 1; }
  @media (hover: none) { .ins { opacity: .55; } }
  .addend { width: 100%; margin-top: 1rem; padding: .8rem !important; border: 2px dashed var(--line) !important; background: none !important; color: var(--muted); font-size: 1rem; }
  .addend:hover { border-color: var(--accent) !important; color: var(--accent); }
  .empty { color: var(--muted); text-align: center; padding: 1.5rem 0 .5rem; }
  .stage { max-width: 56rem; margin: 0 auto; background: var(--paper); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }

  dialog { border: 1px solid var(--ink); border-radius: 12px; padding: 1.25rem 1.5rem; width: min(46rem, 94vw); max-height: 90vh; overflow: auto; color: var(--ink); background: var(--paper); }
  dialog::backdrop { background: rgba(28, 43, 51, .5); }
  dialog h2 { margin: 0 0 .75rem; font-size: 1.3rem; } dialog form { margin-top: 1rem; text-align: right; }
  .blank { width: 100%; text-align: left; } .lead { color: var(--muted); margin: 1rem 0 .5rem; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: .6rem; }
  .card { text-align: left; display: grid; gap: .2rem; padding: .7rem .8rem !important; font-weight: 400 !important; }
  .card span { color: var(--muted); font-size: .88rem; }

  @media (max-width: 800px) {
    .body { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .pages { border-right: 0; border-bottom: 1px solid var(--line); max-height: 11rem; }
    .paper { padding: 1.25rem 1rem 1.5rem; }
  }
</style>
