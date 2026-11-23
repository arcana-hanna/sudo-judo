<script lang="ts">
  let { label, value, min = 1, max = 12, onchange }: { label: string; value: number; min?: number; max?: number; onchange: (v: number) => void } = $props();
</script>

<span class="stp" role="group" aria-label={label}>
  <span class="lab">{label}</span>
  <button onclick={() => onchange(value - 1)} disabled={value <= min} aria-label="{label} verringern">−</button>
  <output aria-live="polite">{value}</output>
  <button onclick={() => onchange(value + 1)} disabled={value >= max} aria-label="{label} erhöhen">+</button>
</span>

<style>
  .stp { display: inline-flex; align-items: center; gap: .15rem; font-size: .9rem; }
  .lab { color: var(--muted); margin-right: .3rem; }
  .stp button { width: 1.9rem; height: 1.9rem; padding: 0 !important; border-radius: 6px !important; line-height: 1; }
  output { min-width: 1.6rem; text-align: center; font-weight: 700; }
</style>
