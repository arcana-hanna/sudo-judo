<script lang="ts">
  import type { TextBlock } from '../../shared/types';
  let { block }: { block: TextBlock; solved?: boolean; onsolved?: () => void } = $props();
  const paragraphs = $derived(block.text.split(/\n{2,}/).filter((p) => p.trim()));
</script>

<div class="text">
  {#each paragraphs as p}<p>{p}</p>{/each}
</div>

<style>
  .text p { margin: 0 0 1em; white-space: pre-line; max-width: 60ch; }
</style>
