<script lang="ts">
  import Inline from './Inline.svelte';
  let { value = $bindable() }: { value: string } = $props();
</script>

<Inline multiline noNewline bind:value cls="q" placeholder="Aufgabenstellung eingeben …" label="Aufgabenstellung" />
