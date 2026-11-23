<script lang="ts">
  import type { Token } from '../types';
  let { tokens, value = $bindable(), maxLen = 10, readonly = false, label = 'Deine Folge' }:
    { tokens: Token[]; value: string[]; maxLen?: number; readonly?: boolean; label?: string } = $props();
  const tok = (id: string) => tokens.find((t) => t.id === id);
  const add = (id: string) => { if (!readonly && value.length < maxLen) value.push(id); };
  const removeAt = (i: number) => { if (!readonly) value.splice(i, 1); };
</script>

{#snippet chip(t: Token | undefined)}
  {#if t?.img}<img src={t.img} alt="" />{/if}<span>{t?.text ?? '?'}</span>
{/snippet}

<div class="seq">
  {#if !readonly}
    <div class="pal" role="group" aria-label="Bausteine">
      {#each tokens as t (t.id)}
        <button class="tk" onclick={() => add(t.id)} disabled={value.length >= maxLen}
          aria-label="{t.text || 'Baustein'} anhängen">{@render chip(t)}</button>
      {/each}
    </div>
  {/if}
  <ol class="line" aria-label={label}>
    {#each value as id, i (i)}
      <li><button class="tk placed" onclick={() => removeAt(i)} disabled={readonly}
        aria-label="{tok(id)?.text || 'Baustein'}, Position {i + 1}{readonly ? '' : ', zum Entfernen anklicken'}">{@render chip(tok(id))}</button></li>
    {/each}
    {#if value.length === 0}<li class="empty">Noch leer – wähle oben Bausteine aus.</li>{/if}
  </ol>
  {#if !readonly}
    <div class="meta">
      <span>{value.length} von höchstens {maxLen}</span>
      <button class="clr" onclick={() => value.splice(0)} disabled={value.length === 0}>Alles löschen</button>
    </div>
  {/if}
</div>

<style>
  .seq { display: grid; gap: .6rem; min-width: 0; }
  .pal { display: flex; flex-wrap: wrap; gap: .4rem; padding: .6rem; background: var(--wash); border-radius: var(--radius); }
  .line { list-style: none; margin: 0; padding: .6rem; display: flex; flex-wrap: wrap; gap: .4rem; min-height: 3.4rem; border: 2px dashed var(--line); border-radius: var(--radius); align-items: center; }
  .empty { color: var(--muted); font-size: .95rem; }
  .tk { display: inline-flex; align-items: center; gap: .4rem; padding: .4rem .8rem; background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius); cursor: pointer; font-size: 1rem; }
  .tk:hover:not(:disabled) { border-color: var(--accent); }
  .tk:disabled { opacity: .5; cursor: default; }
  .tk.placed { background: var(--wash); }
  .tk img { height: 2rem; width: auto; max-width: 4rem; object-fit: contain; }
  .meta { display: flex; gap: 1rem; align-items: center; color: var(--muted); font-size: .9rem; }
  .clr { background: none; border: 0; padding: 0; color: var(--muted); text-decoration: underline; cursor: pointer; }
  .clr:disabled { opacity: .4; cursor: default; }
</style>
