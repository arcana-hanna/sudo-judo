import { mount } from 'svelte';
import Player from '../src/player/Player.svelte';
import { migrate } from '../src/shared/migrate';
import '../src/shared/theme.css';

const target = document.getElementById('app')!;
try {
  const raw = document.getElementById('project-data')?.textContent ?? '';
  const project = migrate(JSON.parse(raw));
  document.title = project.title;
  document.documentElement.dataset.theme = project.theme === 'dojo' ? 'dojo' : 'klar';
  mount(Player, { target, props: { project, useHash: true, persist: true } });
} catch (e) {
  target.innerHTML = '<p style="padding:2rem;font-family:sans-serif">Diese Seite enthält kein gültiges Projekt.</p>';
  console.error(e);
}
