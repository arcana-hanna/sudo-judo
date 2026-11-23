<script lang="ts">
  import { tick } from 'svelte';
  // Textfeld, das im Blatt wie normaler Text aussieht (erst beim Darüberfahren/Anklicken erkennbar).
  let { value = $bindable(''), placeholder = '', label = '', multiline = false, noNewline = false, fit = 0, cls = '', autofocus = false, onkeydown }:
    { value: string; placeholder?: string; label?: string; multiline?: boolean; noNewline?: boolean; fit?: number; cls?: string; autofocus?: boolean;
      onkeydown?: (e: KeyboardEvent) => void } = $props();
  const keys = (e: KeyboardEvent) => { if (noNewline && e.key === 'Enter') e.preventDefault(); onkeydown?.(e); };
  let el: HTMLTextAreaElement | HTMLInputElement | undefined = $state();

  async function autosize() {
    if (!multiline || !el) return;
    await tick();
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
  $effect(() => { value; autosize(); });
  $effect(() => { if (autofocus && el) el.focus(); });
</script>

{#if multiline}
  <textarea bind:this={el} bind:value {placeholder} aria-label={label || placeholder} rows="1" class="inl {cls}" onkeydown={keys}></textarea>
{:else}
  <input bind:this={el} bind:value {placeholder} aria-label={label || placeholder} class="inl {cls}" style={fit ? `width:${Math.max(fit, (value ?? '').length + 1)}ch` : undefined} onkeydown={keys} />
{/if}
