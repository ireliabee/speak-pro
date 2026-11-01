"use client";

import type { LoopId } from "@/data/graph";
import { JOURNEY, LOOP_INTRO_CHAPTER } from "@/data/journey";
import { LOOPS, LOOP_IDS } from "@/data/loops";
import { chapterIndex, reps } from "@/lib/journey";
import { dueCards } from "@/lib/srs";
import { todayISO } from "@/lib/dates";
import { useAppStore } from "@/store/useAppStore";

export interface TodayStripProps {
  onOpenLoop: (loop: LoopId) => void;
}

export default function TodayStrip({ onOpenLoop }: TodayStripProps) {
  const chapters = useAppStore((s) => s.chapters);
  const done = useAppStore((s) => s.done);
  const progress = useAppStore((s) => s.progress);
  const cards = useAppStore((s) => s.cards);
  const idx = chapterIndex({ chapters });
  const today = done[todayISO()] ?? {};
  const due = dueCards(cards).length;

  const visible = LOOP_IDS.filter(
    (k) => JOURNEY.findIndex((c) => c.id === LOOP_INTRO_CHAPTER[k]) <= idx,
  );
  if (!visible.length) return null;

  return (
    <div
      className="absolute bottom-4 left-4 z-[4] flex flex-wrap gap-2.5"
      data-testid="today-strip"
    >
      {visible.map((k) => {
        const l = LOOPS[k];
        const isDone = !!today[k];
        const pct =
          (l.nodes.reduce((a, id) => a + Math.min(reps({ progress }, id), 10), 0) /
            (l.nodes.length * 10)) *
          100;
        return (
          <button
            type="button"
            key={k}
            data-testid={`today-${k}`}
            onClick={() => onOpenLoop(k)}
            className={`min-w-[150px] cursor-pointer rounded-[14px] border bg-[rgba(20,27,39,.9)] px-3 py-2.5 text-left backdrop-blur-[8px] transition-[transform,border-color] duration-[320ms] hover:-translate-y-[3px] hover:border-[#3a4c68] ${
              isDone ? "border-[rgba(95,211,166,.5)]" : "border-line"
            }`}
          >
            <div className="flex justify-between text-[10px] uppercase tracking-[.08em] text-muted">
              <span>{l.icon} step</span>
              {isDone && <span className="font-bold text-green">✓</span>}
            </div>
            <div className="mt-[3px] text-[13px] font-semibold">{l.title}</div>
            <div className="mt-0.5 text-[11px] text-muted">
              {k === "review" ? `${due} due · ` : ""}
              {l.desc}
            </div>
            <div className="mt-2 h-[3px] overflow-hidden rounded-sm bg-[#223047]">
              <i
                className={`block h-full transition-[width] duration-[600ms] ${isDone ? "bg-green" : "bg-orange"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
