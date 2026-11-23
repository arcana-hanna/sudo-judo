<script lang="ts">
  import type { ImageBlock } from '../../shared/types';
  let { block }: { block: ImageBlock; solved?: boolean; onsolved?: () => void } = $props();
</script>

{#if block.src}
  <figure><img src={block.src} alt={block.alt} /></figure>
{/if}

<style>
  figure { margin: 0 0 1.5rem; }
  img { max-width: 100%; height: auto; border-radius: var(--radius); }
</style>
