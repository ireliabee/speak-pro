import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { DisciplineId, LoopId } from "@/data/graph";
import { DISCIPLINES } from "@/data/disciplines";
import { LOOPS } from "@/data/loops";
import { JOURNEY, type Chapter } from "@/data/journey";
import { chapterIndex } from "@/lib/journey";
import { rateCard as srsRate, newCard, type Rating } from "@/lib/srs";
import { EXCELLENT_THRESHOLD, ORWELL_THRESHOLD } from "@/lib/scoring";
import { dayDiff, todayISO } from "@/lib/dates";
import { defaults, type AppState, type LabelMode } from "./state";

export const PERSIST_KEY = "speakpro.v1";
export const LOOP_XP = 15;

export interface WordInput {
  w: string;
  s: string;
}

export interface LoopResult {
  /** Nodes that grew by one rep, in burst order. */
  grown: string[];
  /** Chapter completed as a consequence of this loop, if any. */
  chapter: Chapter | null;
  /** Whether all four loops are now done today. */
  allFourToday: boolean;
}

export interface AppActions {
  onboard: (name: string) => void;
  setMode: (mode: LabelMode) => void;
  setTutorialDone: () => void;
  toggleExpanded: (id: string) => void;
  discoverNode: (id: string) => boolean;
  markRootMet: () => void;
  setDiscipline: (id: DisciplineId) => number;
  addWords: (words: WordInput[], src: string) => number;
  rateCard: (word: string, rating: Rating, now?: number) => void;
  completeLoop: (loop: LoopId, nodeId?: string | null) => LoopResult;
  submitWrite: (fw: string, score: number, longw: number) => LoopResult;
  submitExplain: (concept: string, checksPassed: number) => LoopResult;
  /** Completes the current chapter if its check passes; returns it. */
  checkChapters: () => Chapter | null;
  /** Resets the streak counter when the path has gone cold (called on boot). */
  coolStreakIfStale: () => number | null;
  reset: () => void;
}

export type AppStore = AppState & AppActions;

function touchStreak(s: AppState, today: string): AppState["streak"] {
  if (s.streak.last === today) return s.streak;
  const d = s.streak.last ? dayDiff(s.streak.last, today) : 99;
  const current = d === 1 ? s.streak.current + 1 : 1;
  return { current, best: Math.max(s.streak.best, current), last: today };
}

/** Pure: completes the current chapter when its check passes. */
export function completeChapter(s: AppState): { state: AppState; chapter: Chapter | null } {
  const idx = chapterIndex(s);
  const ch = JOURNEY[idx]!;
  if (idx < JOURNEY.length - 1 && ch.check(s)) {
    return {
      state: { ...s, chapters: { ...s.chapters, [ch.id]: Date.now() }, xp: s.xp + ch.xp },
      chapter: ch,
    };
  }
  return { state: s, chapter: null };
}

/** Pure: applies a loop completion to state and reports what grew. */
export function applyLoop(
  s: AppState,
  loop: LoopId,
  nodeId: string | null,
  now = Date.now(),
): { state: AppState; result: LoopResult } {
  const today = todayISO(new Date(now));
  const ids = new Set<string>(LOOPS[loop].nodes);
  if (nodeId) ids.add(nodeId);
  const progress = { ...s.progress };
  for (const id of ids) progress[id] = (progress[id] ?? 0) + 1;
  const done = { ...s.done, [today]: { ...(s.done[today] ?? {}), [loop]: true } };
  const next: AppState = {
    ...s,
    done,
    streak: touchStreak(s, today),
    progress,
    logs: [...s.logs, { loop, at: now, nodeId }],
    counts: { ...s.counts, [loop]: (s.counts[loop] ?? 0) + 1 },
    xp: s.xp + LOOP_XP,
  };
  const { state, chapter } = completeChapter(next);
  const d = state.done[today] ?? {};
  const allFourToday = (Object.keys(LOOPS) as LoopId[]).every((k) => d[k]);
  return { state, result: { grown: [...ids], chapter, allFourToday } };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...defaults(),

      onboard: (name) => set({ name: name.trim(), onboarded: true }),
      setMode: (mode) => set({ mode }),
      setTutorialDone: () => set({ tutorial: true }),
      toggleExpanded: (id) => set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),

      discoverNode: (id) => {
        const s = get();
        if (s.discovered[id] || (s.progress[id] ?? 0) > 0) return false;
        set({ discovered: { ...s.discovered, [id]: true } });
        return true;
      },

      markRootMet: () => {
        if (get().flags.metRoot) return;
        set((s) => ({ flags: { ...s.flags, metRoot: true } }));
      },

      setDiscipline: (id) => {
        const s = get();
        const seeds = DISCIPLINES[id].words;
        const now = Date.now();
        const words = [...s.words];
        const cards = [...s.cards];
        let added = 0;
        for (const [w, sentence] of seeds) {
          if (!words.find((x) => x.w === w)) {
            words.push({ w, s: sentence, src: "seed", at: now });
            cards.push(newCard(w, sentence, now));
            added++;
          }
        }
        set({ disc: id, expanded: { ...s.expanded, [id]: true }, words, cards });
        return added;
      },

      addWords: (input, src) => {
        const now = Date.now();
        const clean = input.map((x) => ({ w: x.w.trim(), s: x.s.trim() })).filter((x) => x.w);
        if (!clean.length) return 0;
        set((s) => ({
          words: [...s.words, ...clean.map((x) => ({ w: x.w, s: x.s, src, at: now }))],
          cards: [...s.cards, ...clean.map((x) => newCard(x.w, x.s, now))],
        }));
        return clean.length;
      },

      rateCard: (word, rating, now = Date.now()) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.w === word ? srsRate(c, rating, now) : c)),
          reviewed: s.reviewed + 1,
        })),

      completeLoop: (loop, nodeId = null) => {
        const { state, result } = applyLoop(get(), loop, nodeId);
        set(state);
        return result;
      },

      submitWrite: (fw, score, longw) => {
        const s = get();
        const best = { ...s.best, [fw]: Math.max(s.best[fw] ?? 0, score) };
        const flags = { ...s.flags };
        if (score >= ORWELL_THRESHOLD && longw === 0) flags.orwell = true;
        const progress = { ...s.progress };
        if (score >= EXCELLENT_THRESHOLD) progress[fw] = (progress[fw] ?? 0) + 1;
        const { state, result } = applyLoop({ ...s, best, flags, progress }, "write", fw);
        set(state);
        return result;
      },

      submitExplain: (concept, checksPassed) => {
        const s = get();
        const flags = { ...s.flags };
        const progress = { ...s.progress };
        if (checksPassed === 3) {
          progress[concept] = (progress[concept] ?? 0) + 1;
          flags.feynman3 = true;
        }
        const { state, result } = applyLoop({ ...s, flags, progress }, "explain", concept);
        set(state);
        return result;
      },

      checkChapters: () => {
        const { state, chapter } = completeChapter(get());
        if (chapter) set(state);
        return chapter;
      },

      coolStreakIfStale: () => {
        const s = get();
        if (!s.streak.last) return null;
        const gap = dayDiff(s.streak.last, todayISO());
        if (gap <= 1) return null;
        if (s.streak.current !== 0) set({ streak: { ...s.streak, current: 0 } });
        return gap;
      },

      reset: () => set(defaults()),
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => {
        // Persist data only; actions are re-created on load.
        const data: AppState = {
          name: s.name,
          disc: s.disc,
          progress: s.progress,
          discovered: s.discovered,
          words: s.words,
          cards: s.cards,
          logs: s.logs,
          done: s.done,
          streak: s.streak,
          mode: s.mode,
          onboarded: s.onboarded,
          expanded: s.expanded,
          chapters: s.chapters,
          best: s.best,
          flags: s.flags,
          counts: s.counts,
          reviewed: s.reviewed,
          xp: s.xp,
          tutorial: s.tutorial,
        };
        return data as unknown as AppStore;
      },
      merge: (persisted, current) => ({ ...current, ...defaults(), ...(persisted as object) }),
    },
  ),
);

/** True once the persisted state has been read from localStorage (client only). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
