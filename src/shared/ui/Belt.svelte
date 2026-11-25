<script lang="ts">
  import { BELTS } from '../belts';
  let { level, size = 64, decorative = false }: { level: number; size?: number; decorative?: boolean } = $props();
  const b = $derived(BELTS[Math.min(BELTS.length - 1, Math.max(0, Math.round(level) || 0))]);
</script>

<svg viewBox="0 0 72 30" width={size} height={(size * 30) / 72} role={decorative ? undefined : 'img'}
  aria-label={decorative ? undefined : `${b.nom} Gürtel`} aria-hidden={decorative ? 'true' : undefined}>
  <g fill={b.color} stroke="var(--ink)" stroke-opacity=".8" stroke-width="1.6" stroke-linejoin="round">
    <path d="M31 15 L22 28 L31 26 L37 15 Z" />
    <path d="M36 15 L50 28 L41 28.5 L33 15 Z" />
    <rect x="2" y="8" width="68" height="9" rx="3" />
    <rect x="28" y="4.5" width="16" height="16" rx="3.5" />
  </g>
  <rect x="28" y="4.5" width="16" height="16" rx="3.5" fill="#000" opacity=".16" />
</svg>
