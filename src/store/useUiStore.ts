import { create } from "zustand";
import type { LoopId } from "@/data/graph";
import type { Chapter } from "@/data/journey";

export type ModalKind =
  | { kind: "none" }
  | { kind: "loop"; loop: LoopId; nodeId: string | null }
  | { kind: "celebration"; chapter: Chapter; next: Chapter | null }
  | { kind: "reset" }
  | { kind: "snapshot" };

export interface Toast {
  id: number;
  msg: string;
  kind?: "good";
}

/** Imperative commands for the D3 map, consumed by SkillMap. */
export type MapCommand =
  | { type: "burst"; ids: string[]; color?: string; stagger?: number }
  | { type: "drawEdges"; ids: string[] }
  | { type: "zoomTo"; id: string; width?: number }
  | { type: "fit" }
  | { type: "zoomBy"; factor: number }
  | { type: "coolDown" }
  | { type: "pushIn"; id: string | null }
  | { type: "pullBack" }
  /** The standard reward sequence (DESIGN.md §3) on a node. */
  | { type: "reward"; id: string; color?: string };

interface UiState {
  modal: ModalKind;
  focusedId: string | null;
  /** Ritual-bar slot to pulse (e.g. after a cold map relights). */
  pulseSlot: LoopId | null;
  toasts: Toast[];
  commands: Array<MapCommand & { seq: number }>;
  openLoop: (loop: LoopId, nodeId?: string | null) => void;
  openCelebration: (chapter: Chapter, next: Chapter | null) => void;
  openModal: (m: ModalKind) => void;
  closeModal: () => void;
  focus: (id: string | null) => void;
  toast: (msg: string, kind?: "good") => void;
  dismissToast: (id: number) => void;
  send: (cmd: MapCommand) => void;
  consume: (seq: number) => void;
  setPulseSlot: (slot: LoopId | null) => void;
}

let toastSeq = 0;
let cmdSeq = 0;

export const useUiStore = create<UiState>()((set) => ({
  modal: { kind: "none" },
  focusedId: null,
  pulseSlot: null,
  toasts: [],
  commands: [],
  openLoop: (loop, nodeId = null) => set({ modal: { kind: "loop", loop, nodeId } }),
  openCelebration: (chapter, next) => set({ modal: { kind: "celebration", chapter, next } }),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: { kind: "none" } }),
  focus: (focusedId) => set({ focusedId }),
  toast: (msg, kind) => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  send: (cmd) => set((s) => ({ commands: [...s.commands, { ...cmd, seq: ++cmdSeq }] })),
  consume: (seq) => set((s) => ({ commands: s.commands.filter((c) => c.seq !== seq) })),
  setPulseSlot: (pulseSlot) => set({ pulseSlot }),
}));
