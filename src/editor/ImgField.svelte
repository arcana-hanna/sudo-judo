<script lang="ts">
  import { fileToImage } from './image';
  let { value = $bindable(), max = 480, label = 'Bild', compact = false, removeLabel = '', onimage }:
    { value: string | undefined; max?: number; label?: string; compact?: boolean; removeLabel?: string; onimage?: (d: { w: number; h: number }) => void } = $props();
  let error = $state('');
  async function pick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0]; input.value = '';
    if (!f) return;
    try { const im = await fileToImage(f, max); value = im.url; onimage?.({ w: im.w, h: im.h }); error = ''; } catch { error = 'Bild nicht lesbar'; }
  }
</script>

<span class="img">
  {#if value && !compact}<img src={value} alt="" />{/if}
  <label class="pick" title={value ? label + ' ändern' : label + ' hinzufügen'}>
    <input type="file" accept="image/*" onchange={pick} aria-label={label} />
    <span>{compact ? '🖼' : value ? 'Bild ändern' : '+ ' + label}</span>
  </label>
  {#if value}<button class="ico" onclick={() => (value = undefined)} aria-label={removeLabel || `${label} entfernen`} title="Bild entfernen">✕</button>{/if}
  {#if error}<small class="err">{error}</small>{/if}
</span>

<style>
  .img { display: inline-flex; align-items: center; gap: .3rem; flex-wrap: wrap; }
  img { height: 2.2rem; width: auto; max-width: 4rem; object-fit: contain; border: 1px solid var(--line); border-radius: 4px; background: #fff; }
  .pick { position: relative; display: inline-block; padding: .2rem .5rem; border: 2px solid var(--line); border-radius: var(--radius); cursor: pointer; font-size: .85rem; font-weight: 600; background: var(--paper); }
  .pick:hover, .pick:focus-within { border-color: var(--accent); }
  .pick span { white-space: nowrap; }
  .pick input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
  .err { color: var(--bad); }
</style>
