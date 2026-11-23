import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Baut den Player als EINE HTML-Datei (Vorlage für jeden Export).
export default defineConfig({
  root: 'player',
  base: './',
  plugins: [svelte({ preprocess: vitePreprocess() }), viteSingleFile()],
  build: { outDir: '../player-dist', emptyOutDir: true, target: 'es2020' },
});
