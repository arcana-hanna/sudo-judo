<script lang="ts">
  import type { TextBlock } from '../../shared/types';
  import Inline from '../ui/Inline.svelte';
  let { block = $bindable() }: { block: TextBlock } = $props();
</script>

<Inline multiline bind:value={block.text} cls="para" placeholder="Text eingeben … (eine Leerzeile beginnt einen neuen Absatz)" label="Text" />
