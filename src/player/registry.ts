import type { Component } from 'svelte';
import Text from './blocks/Text.svelte';
import Mc from './blocks/Mc.svelte';
import Order from './blocks/Order.svelte';
import Image from './blocks/Image.svelte';
import Sort from './blocks/Sort.svelte';
import Grid from './blocks/Grid.svelte';
import Graph from './blocks/Graph.svelte';
import Robot from './blocks/Robot.svelte';
import Seq from './blocks/Seq.svelte';
import Slots from './blocks/Slots.svelte';
import Cells from './blocks/Cells.svelte';

export interface PlayerBlockDef {
  component: Component<any>;
  /** Zählt der Block als Aufgabe (für den Fortschritt)? */
  exercise: boolean;
}

export const playerBlocks: Record<string, PlayerBlockDef> = {
  text: { component: Text, exercise: false },
  mc: { component: Mc, exercise: true },
  order: { component: Order, exercise: true },
  image: { component: Image, exercise: false },
  sort: { component: Sort, exercise: true },
  grid: { component: Grid, exercise: true },
  graph: { component: Graph, exercise: true },
  robot: { component: Robot, exercise: true },
  seq: { component: Seq, exercise: true },
  slots: { component: Slots, exercise: true },
  cells: { component: Cells, exercise: true },
};
