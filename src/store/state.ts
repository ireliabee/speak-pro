import type { DisciplineId, LoopId } from "@/data/graph";

export type LabelMode = "fw" | "orig";

export interface WordEntry {
  w: string;
  s: string;
  src: string;
  at: number;
}

export interface Card {
  w: string;
  s: string;
  /** Leitner box 1..5 */
  box: number;
  /** Epoch ms when next due */
  next: number;
}

export interface LoopLog {
  loop: LoopId;
  at: number;
  nodeId: string | null;
}

export interface Streak {
  current: number;
  best: number;
  /** ISO date (YYYY-MM-DD) of the last completed step */
  last: string | null;
}

export interface Flags {
  metRoot?: boolean;
  feynman3?: boolean;
  orwell?: boolean;
}

export interface AppState {
  name: string;
  disc: DisciplineId | null;
  /** reps per node id */
  progress: Record<string, number>;
  discovered: Record<string, boolean>;
  words: WordEntry[];
  cards: Card[];
  logs: LoopLog[];
  /** ISO date -> loop -> done */
  done: Record<string, Partial<Record<LoopId, boolean>>>;
  streak: Streak;
  mode: LabelMode;
  onboarded: boolean;
  expanded: Record<string, boolean>;
  /** chapter id -> completion time */
  chapters: Record<string, number>;
  /** best writing score per framework id */
  best: Record<string, number>;
  flags: Flags;
  counts: Record<LoopId, number>;
  reviewed: number;
  xp: number;
  tutorial: boolean;
  /** Epoch ms of the last completed loop (drives lit / at-risk / cold). */
  lastActionAt: number | null;
  /** Reward tones on/off. */
  sound: boolean;
}

export const defaults = (): AppState => ({
  name: "",
  disc: null,
  progress: {},
  discovered: {},
  words: [],
  cards: [],
  logs: [],
  done: {},
  streak: { current: 0, best: 0, last: null },
  mode: "fw",
  onboarded: false,
  expanded: {},
  chapters: {},
  best: {},
  flags: {},
  counts: { read: 0, write: 0, explain: 0, review: 0 },
  reviewed: 0,
  xp: 0,
  tutorial: false,
  lastActionAt: null,
  sound: true,
});
