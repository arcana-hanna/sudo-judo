import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Baut den Editor als EINE HTML-Datei (läuft offline und auf GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [svelte({ preprocess: vitePreprocess() }), viteSingleFile()],
  build: { outDir: 'dist', target: 'es2020' },
});
