<script lang="ts">
  import { uid, type SeqBlock } from '../../shared/types';
  import SeqBuilder from '../../shared/ui/SeqBuilder.svelte';
  import AnswerTabs from '../AnswerTabs.svelte';
  import Steps from '../ui/Steps.svelte';
  import Stepper from '../ui/Stepper.svelte';
  import Inline from '../ui/Inline.svelte';
  import ImgField from '../ImgField.svelte';
  let { block = $bindable() }: { block: SeqBlock } = $props();

  let step = $state<'build' | 'solve'>('build');
  let cur = $state(0);
  let newId = $state('');
  const answer = $derived(block.answers[Math.min(cur, block.answers.length - 1)]);

  function addToken() { const t = { id: uid(), text: '' }; block.tokens.push(t); newId = t.id; }
  function removeToken(i: number) {
    const [gone] = block.tokens.splice(i, 1);
    block.answers = block.answers.map((a) => a.filter((t) => t !== gone.id));
  }
  const addAnswer = () => { block.answers.push([...answer]); cur = block.answers.length - 1; };
  const delAnswer = () => { if (block.answers.length > 1) { block.answers.splice(cur, 1); cur = 0; } };
</script>

<Steps bind:step />

{#if step === 'build'}
  <p class="cap">Das sind die Bausteine, aus denen die Schüler ihre Folge bauen. Jeder Baustein darf beliebig oft benutzt werden.</p>
  <div class="tokens">
    {#each block.tokens as t, i (t.id)}
      <span class="tchip">
        {#if t.img}<img src={t.img} alt="" />{/if}
        <Inline fit={4} bind:value={t.text} placeholder="Baustein {i + 1}" label="Baustein {i + 1}" autofocus={t.id === newId} />
        <span class="tools"><ImgField bind:value={t.img} label="Bild" compact />
          <button class="x" onclick={() => removeToken(i)} disabled={block.tokens.length <= 2} aria-label="Baustein {i + 1} löschen">✕</button></span>
      </span>
    {/each}
    <button class="addtok" onclick={addToken}>+ Baustein</button>
  </div>
  <div class="set"><Stepper label="Höchste Länge" value={block.maxLen} min={1} max={30} onchange={(v) => (block.maxLen = v)} /></div>
{:else}
  <p class="cap">Baue die richtige Folge – so wie es ein Schüler tun würde. Mehrere richtige Folgen sind möglich.</p>
  <AnswerTabs count={block.answers.length} bind:cur onadd={addAnswer} ondel={delAnswer} />
  <SeqBuilder tokens={block.tokens} bind:value={block.answers[Math.min(cur, block.answers.length - 1)]} maxLen={block.maxLen} label="Richtige Folge {cur + 1}" />
{/if}

<style>
  .cap { margin: 0 0 .6rem; font-size: .9rem; color: var(--muted); }
  .tokens { display: flex; flex-wrap: wrap; gap: .5rem; padding: .6rem; background: var(--wash); border-radius: var(--radius); align-items: center; }
  .tchip { position: relative; display: inline-flex; align-items: center; gap: .3rem; padding: .15rem .5rem; border: 2px solid var(--line); border-radius: var(--radius); background: var(--paper); }
  .tchip img { height: 2rem; width: auto; max-width: 4rem; object-fit: contain; }
  .tchip :global(.inl) { width: auto; min-width: 4rem; field-sizing: content; }
  .tools { position: absolute; top: -2rem; left: 0; z-index: 4; display: inline-flex; gap: .2rem; align-items: center; padding: .15rem .3rem; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 2px 10px rgba(28, 43, 51, .15); opacity: 0; pointer-events: none; transition: opacity .12s; white-space: nowrap; }
  .tchip:hover .tools, .tchip:focus-within .tools { opacity: 1; pointer-events: auto; }
  @media (hover: none) { .tools { position: static; opacity: 1; pointer-events: auto; box-shadow: none; border: 0; padding: 0; } }
  .x { background: none; border: 0; color: var(--muted); cursor: pointer; padding: .2rem .4rem; border-radius: 6px; }
  .x:hover:not(:disabled) { background: var(--bad-wash); color: var(--bad); } .x:disabled { opacity: .3; cursor: default; }
  .addtok { border: 2px dashed var(--line) !important; background: none !important; color: var(--muted); }
  .addtok:hover { color: var(--accent); border-color: var(--accent) !important; }
  .set { margin-top: .8rem; }
</style>
