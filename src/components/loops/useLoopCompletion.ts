"use client";

import { useCallback } from "react";
import { COLORS, type LoopId } from "@/data/graph";
import { JOURNEY } from "@/data/journey";
import { playChord, playLoopTone } from "@/lib/audio";
import { useAppStore, type LoopResult } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { REWARD } from "@/components/map/SkillMap";

const BURST_STAGGER = 110;

/**
 * Shared choreography after any loop completes (DESIGN.md §3): close the modal,
 * pull the camera back, play the loop's tone, run the standard reward sequence on the
 * loop's node, grow the other nodes, and — if a chapter completed — celebrate.
 */
export function useLoopCompletion(loop: LoopId) {
  const closeModal = useUiStore((s) => s.closeModal);
  const send = useUiStore((s) => s.send);
  const toast = useUiStore((s) => s.toast);
  const openCelebration = useUiStore((s) => s.openCelebration);

  return useCallback(
    (result: LoopResult, message: string, primaryNode?: string | null) => {
      closeModal();
      send({ type: "pullBack" });
      if (useAppStore.getState().sound) playLoopTone(loop);

      const main = primaryNode ?? result.grown[0] ?? "azair";
      const rest = result.grown.filter((id) => id !== main);
      send({ type: "reward", id: main });
      setTimeout(
        () => send({ type: "burst", ids: rest, stagger: BURST_STAGGER }),
        REWARD.dim + REWARD.wipe,
      );
      const rootDelay = REWARD.total + rest.length * BURST_STAGGER;
      setTimeout(() => send({ type: "burst", ids: ["azair"], color: COLORS.orange }), rootDelay);
      toast(message, "good");

      if (result.allFourToday) {
        const streak = useAppStore.getState().streak.current;
        setTimeout(() => {
          if (useAppStore.getState().sound) playChord();
          toast(`🔥 All four steps done. Streak: ${streak} day${streak > 1 ? "s" : ""}`, "good");
        }, 900);
      }
      if (result.chapter) {
        const ch = result.chapter;
        const idx = JOURNEY.findIndex((c) => c.id === ch.id);
        const next = JOURNEY[idx + 1] ?? null;
        setTimeout(
          () => send({ type: "reward", id: ch.node, color: COLORS.orange }),
          rootDelay + 300,
        );
        setTimeout(() => openCelebration(ch, next), rootDelay + 300 + REWARD.total);
      }
    },
    [closeModal, send, toast, openCelebration, loop],
  );
}
