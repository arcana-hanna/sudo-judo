<script lang="ts">
  import type { OrderBlock } from '../../shared/types';
  import { countValidOrders } from '../../shared/order';
  let { block = $bindable() }: { block: OrderBlock } = $props();

  const name = (id: string) => { const i = block.items.findIndex((x) => x.id === id); return i < 0 ? '?' : `${i + 1}. ${block.items[i].text || 'Karte'}`; };
  const on = $derived(block.mode === 'rules');
  function toggle(v: boolean) { block.mode = v ? 'rules' : 'fixed'; if (v && !block.rules) block.rules = []; }
  function addRule() { const [a, b] = block.items; (block.rules ??= []).push({ a: a?.id ?? '', b: b?.id ?? '' }); }
  const nValid = $derived(on ? countValidOrders(block.items.map((i) => i.id), block.rules ?? []) : 1);
</script>

<label class="sw"><input type="checkbox" checked={on} onchange={(e) => toggle(e.currentTarget.checked)} />
  Mehrere Reihenfolgen sind richtig – ich lege Regeln fest („A vor B“)</label>

{#if on}
  <div class="rules">
    {#each block.rules ?? [] as r, k (k)}
      <div class="rule">
        <select bind:value={r.a} aria-label="Zuerst">{#each block.items as it (it.id)}<option value={it.id}>{name(it.id)}</option>{/each}</select>
        <span>muss vor</span>
        <select bind:value={r.b} aria-label="Danach">{#each block.items as it (it.id)}<option value={it.id}>{name(it.id)}</option>{/each}</select>
        <span>stehen</span>
        <button class="x" onclick={() => block.rules!.splice(k, 1)} aria-label="Regel löschen">✕</button>
      </div>
    {/each}
    <button class="small" onclick={addRule} disabled={block.items.length < 2}>+ Regel</button>
    {#if nValid === 0}<p class="warn">Die Regeln widersprechen sich – keine Reihenfolge erfüllt sie.</p>
    {:else if nValid > 0}<p class="info">{nValid} {nValid === 1 ? 'Reihenfolge ist' : 'Reihenfolgen sind'} richtig.</p>
    {:else}<p class="info">Sehr viele Reihenfolgen sind richtig.</p>{/if}
  </div>
{/if}

<style>
  .sw { display: flex; gap: .5rem; align-items: center; font-size: .95rem; }
  .rules { margin-top: .6rem; display: grid; gap: .4rem; justify-items: start; }
  .rule { display: flex; gap: .4rem; align-items: center; flex-wrap: wrap; font-size: .95rem; }
  select { padding: .35rem; border: 2px solid var(--line); border-radius: var(--radius); background: var(--paper); max-width: 14rem; }
  .x { background: none; border: 0; color: var(--muted); cursor: pointer; }
  .warn { color: var(--bad); margin: 0; font-size: .9rem; } .info { color: var(--good); margin: 0; font-size: .9rem; font-weight: 650; }
</style>
