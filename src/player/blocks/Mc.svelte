<script lang="ts">
  import { str } from '../../shared/theme.svelte';
  import type { McBlock } from '../../shared/types';
  let { block, solved = false, onsolved }:
    { block: McBlock; solved?: boolean; onsolved?: () => void } = $props();

  let picked = $state<string[]>([]);
  let result = $state<'idle' | 'ok' | 'no'>('idle');

  const correctIds = $derived(block.options.filter((o) => o.correct).map((o) => o.id));
  const multi = $derived(correctIds.length > 1);

  // Bereits gelöste Aufgabe (z. B. aus dem Browser-Speicher) zeigt die Lösung.
  $effect(() => {
    if (solved) { picked = correctIds; result = 'ok'; }
  });

  function toggle(id: string) {
    result = 'idle';
    if (multi) picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    else picked = [id];
  }

  function check() {
    const ok = picked.length === correctIds.length && correctIds.every((id) => picked.includes(id));
    result = ok ? 'ok' : 'no';
    if (ok) onsolved?.();
  }
</script>

<fieldset class="mc" class:solved>
  <legend>{block.question}</legend>
  {#if multi}<p class="note">Mehrere Antworten können richtig sein.</p>{/if}
  {#each block.options as o (o.id)}
    <label class="opt" class:picked={picked.includes(o.id)}>
      <input type={multi ? 'checkbox' : 'radio'} name={block.id}
        checked={picked.includes(o.id)} disabled={solved} onchange={() => toggle(o.id)} />
      {#if o.img}<img class="oimg" src={o.img} alt={o.text ? '' : 'Bildantwort'} />{/if}
      <span>{o.text}</span>
    </label>
  {/each}

  <div class="row">
    <button class="check" onclick={check} disabled={solved || picked.length === 0}>Prüfen</button>
    <p class="msg" role="status">
      {#if result === 'ok'}<span class="ok">{str().ok}</span>
      {:else if result === 'no'}<span class="no">{str().no}</span>
        {#if block.hint}<span class="hint">{str().tip} {block.hint}</span>{/if}
      {/if}
    </p>
  </div>
</fieldset>

<style>
  .mc { border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem 1.25rem 1.25rem; margin: 0 0 1.5rem; }
  .mc.solved { border-color: var(--good); }
  legend { font-weight: 650; font-size: 1.15rem; padding: 0 .5rem; margin-left: -.5rem; max-width: 60ch; }
  .note { color: var(--muted); margin: 0 0 .5rem; font-size: .95rem; }
  .opt { display: flex; gap: .75rem; align-items: center; padding: .65rem .85rem; margin: .4rem 0;
         border: 2px solid var(--line); border-radius: var(--radius); cursor: pointer; }
  .opt:hover { background: var(--wash); }
  .opt.picked { border-color: var(--accent); background: var(--wash); }
  .opt input { width: 1.2rem; height: 1.2rem; accent-color: var(--accent); }
  .row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
  .check { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: var(--btn-radius);
           padding: .6rem 1.4rem; font-weight: 650; cursor: pointer; }
  .check:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .msg { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
  .ok { color: var(--good); font-weight: 650; }
  .no { color: var(--bad); font-weight: 650; }
  .hint { color: var(--ink); }
  .oimg { max-height: 8rem; max-width: 14rem; object-fit: contain; border-radius: 4px; background: #fff; }
</style>
