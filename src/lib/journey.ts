import { JOURNEY, type Chapter } from "@/data/journey";
import { HUB_OF, LEAVES, NODES, hubOfNode, type GraphNode } from "@/data/graph";
import { LEVELS } from "@/data/levels";
import { DISCIPLINE_IDS } from "@/data/disciplines";
import type { AppState } from "@/store/state";

export interface LevelInfo {
  name: string;
  from: number;
  next: { xp: number; name: string } | null;
}

export function levelOf(xp: number): LevelInfo {
  let level = LEVELS[0]!;
  let next: LevelInfo["next"] = null;
  for (let i = 0; i < LEVELS.length; i++) {
    const l = LEVELS[i]!;
    if (xp >= l.xp) {
      level = l;
      next = LEVELS[i + 1] ?? null;
    }
  }
  return { name: level.name, from: level.xp, next };
}

/** Index of the first unfinished chapter (or the last chapter if all are done). */
export function chapterIndex(s: Pick<AppState, "chapters">): number {
  for (let i = 0; i < JOURNEY.length; i++) {
    const c = JOURNEY[i]!;
    if (!s.chapters[c.id]) return i;
  }
  return JOURNEY.length - 1;
}

export function currentChapter(s: Pick<AppState, "chapters">): Chapter {
  return JOURNEY[chapterIndex(s)]!;
}

/** The set of node ids visible (not fogged) on the map. */
export function revealed(s: Pick<AppState, "chapters" | "disc">): Set<string> {
  const idx = chapterIndex(s);
  const set = new Set<string>(["azair"]);
  for (let i = 0; i <= idx; i++) {
    const n = JOURNEY[i]!.node;
    set.add(n);
    if (i < idx) {
      const h = hubOfNode(n);
      if (h) for (const k of HUB_OF[h] ?? []) set.add(k);
    }
  }
  if (s.disc) set.add(s.disc);
  if (Object.keys(s.chapters).length >= JOURNEY.length - 1) {
    for (const n of NODES) set.add(n.id);
  }
  if (s.chapters.disc) {
    for (const k of DISCIPLINE_IDS) set.add(k);
  }
  return set;
}

export type NodeState = "locked" | "discovered" | "practising" | "mastered";

export const reps = (s: Pick<AppState, "progress">, id: string): number => s.progress[id] ?? 0;

export function masteryPct(s: Pick<AppState, "progress">): number {
  let sum = 0;
  for (const n of LEAVES) sum += Math.min(reps(s, n.id), 10) / 10;
  return Math.round((sum / LEAVES.length) * 100);
}

export function stateOf(
  s: Pick<AppState, "progress" | "discovered">,
  n: GraphNode,
): NodeState | "" {
  if (n.type !== "n") return "";
  if (n.root) {
    const m = masteryPct(s);
    return m >= 80 ? "mastered" : m >= 20 ? "practising" : m > 0 ? "discovered" : "locked";
  }
  const r = reps(s, n.id);
  return r >= 10
    ? "mastered"
    : r >= 3
      ? "practising"
      : r >= 1 || s.discovered[n.id]
        ? "discovered"
        : "locked";
}

export interface QuestProgress {
  pct: number;
  txt: string;
}

export function questProgress(s: AppState, ch: Chapter): QuestProgress | null {
  switch (ch.id) {
    case "read1":
      return { pct: Math.min(100, (s.words.length / 5) * 100), txt: `${s.words.length}/5 words` };
    case "review1":
      return { pct: Math.min(100, (s.reviewed / 5) * 100), txt: `${s.reviewed}/5 reviews` };
    case "etym":
      return { pct: Math.min(100, (s.reviewed / 15) * 100), txt: `${s.reviewed}/15 reviews` };
    case "aloud":
      return {
        pct: Math.min(100, s.counts.explain * 100),
        txt: `${s.counts.explain}/1 sessions`,
      };
    case "feyn":
      return {
        pct: Math.min(100, (s.counts.explain / 3) * 100),
        txt: `${s.counts.explain}/3 sessions · 3/3 checks ${s.flags.feynman3 ? "✓" : "✗"}`,
      };
    case "socratic":
      return {
        pct: Math.min(100, (s.counts.explain / 5) * 100),
        txt: `${s.counts.explain}/5 sessions`,
      };
    case "minto":
      return {
        pct: Math.min(100, (s.words.length / 30) * 100),
        txt: `${s.words.length}/30 words`,
      };
    case "vocab":
      return {
        pct: Math.min(100, Math.min(s.words.length, 50) + Math.min(s.reviewed, 50)),
        txt: `${s.words.length}/50 words · ${s.reviewed}/50 reviews`,
      };
    case "orwell":
      return { pct: s.flags.orwell ? 100 : 0, txt: "80+ score with 0 long words" };
    default: {
      const b = s.best[ch.node];
      return b !== undefined
        ? { pct: Math.min(100, (b / 60) * 100), txt: `best score ${b} (need 60)` }
        : null;
    }
  }
}
