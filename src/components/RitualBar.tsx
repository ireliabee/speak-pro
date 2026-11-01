"use client";

import { useEffect } from "react";
import { COLORS, type LoopId } from "@/data/graph";
import { JOURNEY, LOOP_INTRO_CHAPTER } from "@/data/journey";
import { LOOPS, LOOP_IDS } from "@/data/loops";
import { chapterIndex, reps } from "@/lib/journey";
import { dueCards } from "@/lib/srs";
import { todayISO } from "@/lib/dates";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";

export interface RitualBarProps {
  onOpenLoop: (loop: LoopId) => void;
}

/** Fixed slot order and colour — the same every day (DESIGN.md §4). */
export const SLOT_ORDER: readonly LoopId[] = ["read", "write", "explain", "review"];
export const SLOT_COLOR: Readonly<Record<LoopId, string>> = {
  read: COLORS.purple,
  write: COLORS.green,
  explain: COLORS.teal,
  review: COLORS.blue,
};
export const SLOT_KEY: Readonly<Record<LoopId, string>> = {
  read: "1",
  write: "2",
  explain: "3",
  review: "4",
};
const SLOT_LABEL: Readonly<Record<LoopId, string>> = {
  read: "READ",
  write: "WRITE",
  explain: "SPEAK",
  review: "REVIEW",
};

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

export default function RitualBar({ onOpenLoop }: RitualBarProps) {
  const chapters = useAppStore((s) => s.chapters);
  const done = useAppStore((s) => s.done);
  const progress = useAppStore((s) => s.progress);
  const cards = useAppStore((s) => s.cards);
  const modalKind = useUiStore((s) => s.modal.kind);
  const pulseSlot = useUiStore((s) => s.pulseSlot);
  const idx = chapterIndex({ chapters });
  const today = done[todayISO()] ?? {};
  const due = dueCards(cards).length;

  const unlocked = (k: LoopId): boolean =>
    JOURNEY.findIndex((c) => c.id === LOOP_INTRO_CHAPTER[k]) <= idx;
  const anyUnlocked = LOOP_IDS.some(unlocked);

  // Keyboard shortcuts 1–4 open the four loops.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalKind !== "none" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(document.activeElement)) return;
      const slot = SLOT_ORDER.find((k) => SLOT_KEY[k] === e.key);
      if (!slot || !unlocked(slot)) return;
      e.preventDefault();
      onOpenLoop(slot);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalKind, idx, onOpenLoop]);

  if (!anyUnlocked) return null;

  return (
    <div
      className="absolute bottom-4 left-4 z-[4] flex flex-wrap gap-2.5"
      data-testid="ritual-bar"
      role="toolbar"
      aria-label="Daily ritual"
    >
      {SLOT_ORDER.map((k) => {
        const l = LOOPS[k];
        const isDone = !!today[k];
        const locked = !unlocked(k);
        const introIdx = JOURNEY.findIndex((c) => c.id === LOOP_INTRO_CHAPTER[k]);
        const pct =
          (l.nodes.reduce((a, id) => a + Math.min(reps({ progress }, id), 10), 0) /
            (l.nodes.length * 10)) *
          100;
        const state = locked ? "locked" : isDone ? "done" : "ready";
        return (
          <button
            type="button"
            key={k}
            className={`slot${pulseSlot === k ? " pulse" : ""}`}
            style={{ "--slot-color": SLOT_COLOR[k] } as React.CSSProperties}
            data-testid={`today-${k}`}
            data-slot={k}
            data-state={state}
            disabled={locked}
            aria-keyshortcuts={SLOT_KEY[k]}
            title={
              locked ? `Unlocks at chapter ${introIdx + 1}` : `${l.title} (press ${SLOT_KEY[k]})`
            }
            onClick={() => onOpenLoop(k)}
          >
            <span className="key" aria-hidden>
              {SLOT_KEY[k]}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.08em] text-muted">
              <span>{l.icon}</span>
              <span>{SLOT_LABEL[k]}</span>
              {isDone && (
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-label="done">
                  <path d="M3 8.5l3.2 3L13 4.5" className="check" pathLength={1} />
                </svg>
              )}
            </div>
            <div className="mt-[3px] text-[13px] font-semibold">{l.title}</div>
            <div className="mt-0.5 text-[11px] text-muted">
              {locked
                ? `Unlocks at chapter ${introIdx + 1}`
                : `${k === "review" ? `${due} due · ` : ""}${l.desc}`}
            </div>
            <div className="mt-2 h-[3px] overflow-hidden rounded-sm bg-[#223047]">
              <i
                className="block h-full transition-[width] duration-[600ms]"
                style={{ width: `${pct}%`, background: isDone ? SLOT_COLOR[k] : COLORS.orange }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
