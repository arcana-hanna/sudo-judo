<script lang="ts">
  import type { ImageBlock } from '../../shared/types';
  import ImgField from '../ImgField.svelte';
  import Inline from '../ui/Inline.svelte';
  let { block = $bindable() }: { block: ImageBlock } = $props();
  const kb = $derived(Math.round(((block.src ?? '').length * 0.75) / 1024));
  $effect(() => { if (block.src === undefined) block.src = ''; });
</script>

{#if block.src}
  <img class="thumb" src={block.src} alt={block.alt} />
{:else}
  <div class="empty">Noch kein Bild – wähle eins aus.</div>
{/if}
<div class="row">
  <ImgField bind:value={block.src} max={900} label="Bild wählen" removeLabel="Bild entfernen" />
  {#if block.src}<small>{kb} KB{kb > 400 ? ' – groß, die Datei wird dadurch langsamer' : ''}</small>{/if}
</div>
<label class="alt"><span>Bildbeschreibung für Screenreader:</span>
  <Inline bind:value={block.alt} placeholder="z. B. Ein Biber baut einen Damm" label="Bildbeschreibung" /></label>

<style>
  .thumb { display: block; max-width: 100%; max-height: 22rem; border-radius: var(--radius); }
  .empty { padding: 2rem; text-align: center; color: var(--muted); border: 2px dashed var(--line); border-radius: var(--radius); }
  .row { display: flex; gap: .8rem; align-items: center; margin: .6rem 0; flex-wrap: wrap; }
  small { color: var(--muted); }
  .alt { display: flex; gap: .5rem; align-items: center; font-size: .92rem; } .alt span { color: var(--muted); white-space: nowrap; }
</style>
