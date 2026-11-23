import type { StmtType } from '../types';

/** Gemeinsamer Zustand für Ziehen und "Block auswählen, dann Platz anklicken". */
export const dnd = $state<{
  armed: StmtType | '';                                           // in der Palette gewählter Blocktyp
  drag: null | { kind: 'new'; t: StmtType } | { kind: 'move'; id: string };
}>({ armed: '', drag: null });
