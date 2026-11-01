"use client";

import { useCallback } from "react";
import { COLORS } from "@/data/graph";
import { JOURNEY } from "@/data/journey";
import { useAppStore, type LoopResult } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";

const BURST_STAGGER = 110;

/**
 * Shared choreography after any loop completes: close the modal, burst the nodes
 * that grew, redraw their edges, toast, and — if a chapter was completed — celebrate.
 */
export function useLoopCompletion() {
  const closeModal = useUiStore((s) => s.closeModal);
  const send = useUiStore((s) => s.send);
  const toast = useUiStore((s) => s.toast);
  const openCelebration = useUiStore((s) => s.openCelebration);

  return useCallback(
    (result: LoopResult, message: string) => {
      closeModal();
      send({ type: "burst", ids: result.grown, stagger: BURST_STAGGER });
      send({ type: "drawEdges", ids: result.grown });
      const rootDelay = result.grown.length * BURST_STAGGER + 100;
      setTimeout(() => send({ type: "burst", ids: ["azair"], color: COLORS.orange }), rootDelay);
      toast(message, "good");
      if (result.allFourToday) {
        const streak = useAppStore.getState().streak.current;
        setTimeout(
          () =>
            toast(`🔥 All four steps done. Streak: ${streak} day${streak > 1 ? "s" : ""}`, "good"),
          900,
        );
      }
      if (result.chapter) {
        const ch = result.chapter;
        const idx = JOURNEY.findIndex((c) => c.id === ch.id);
        const next = JOURNEY[idx + 1] ?? null;
        setTimeout(() => {
          send({ type: "burst", ids: [ch.node], color: COLORS.orange });
          send({ type: "drawEdges", ids: [ch.node] });
        }, rootDelay + 400);
        setTimeout(() => openCelebration(ch, next), rootDelay + 1000);
      }
    },
    [closeModal, send, toast, openCelebration],
  );
}
