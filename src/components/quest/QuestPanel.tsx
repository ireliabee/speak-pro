"use client";

import { motion } from "framer-motion";
import { JOURNEY, type ChapterAction } from "@/data/journey";
import { LOOPS } from "@/data/loops";
import { chapterIndex, levelOf, questProgress } from "@/lib/journey";
import { dueCards } from "@/lib/srs";
import { useAppStore } from "@/store/useAppStore";

export interface QuestPanelProps {
  onAction: (action: ChapterAction) => void;
}

export default function QuestPanel({ onAction }: QuestPanelProps) {
  const state = useAppStore();
  const idx = chapterIndex(state);
  const ch = JOURNEY[idx]!;
  const done = Object.keys(state.chapters).length;
  const lv = levelOf(state.xp);
  const prog = questProgress(state, ch);
  const finished = idx === JOURNEY.length - 1 && done >= JOURNEY.length - 1;
  const xpPct = lv.next ? Math.round(((state.xp - lv.from) / (lv.next.xp - lv.from)) * 100) : 100;
  const due = dueCards(state.cards).length;

  const buttonLabel = (a: ChapterAction): string => {
    switch (a.type) {
      case "focus":
        return "Find the node";
      case "disc":
        return "Show disciplines";
      case "loop":
        return `${LOOPS[a.loop].icon} Start: ${LOOPS[a.loop].title}`;
    }
  };

  return (
    <motion.div
      className="quest"
      data-testid="quest-panel"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex justify-between text-[11px] uppercase tracking-[.08em] text-muted">
        <span>
          Chapter {Math.min(done + 1, JOURNEY.length)} of {JOURNEY.length}
        </span>
        <span className="text-orange" data-testid="quest-level">
          {lv.name} · {state.xp} XP
        </span>
      </div>
      <div className="my-2 mb-3.5 h-1 overflow-hidden rounded-sm bg-[#223047]">
        <i
          className="block h-full bg-orange transition-[width] duration-[600ms]"
          style={{ width: `${xpPct}%` }}
        />
      </div>
      <h2 className="m-0 mb-1.5 font-serif text-2xl font-semibold" data-testid="quest-title">
        {ch.title}
      </h2>
      <p className="m-0 mb-2.5 text-[13.5px] leading-[1.6] text-ink2">{ch.lesson}</p>
      <div className="mt-2 rounded-xl border border-line bg-bg2 p-3">
        <span className="mb-1 block text-[10px] uppercase tracking-[.08em] text-muted">
          Objective
        </span>
        <b className="text-sm" data-testid="quest-objective">
          {ch.objective}
        </b>
        {prog && (
          <>
            <div className="meter my-2 mb-1">
              <i style={{ width: `${prog.pct}%` }} />
            </div>
            <span className="text-[11px] text-muted">{prog.txt}</span>
          </>
        )}
      </div>
      {finished ? (
        <p className="mt-3 text-[13.5px] leading-[1.6] text-ink2">
          🏆 Journey complete. The daily steps below are now your endless mode.
        </p>
      ) : (
        <button
          type="button"
          className="btn primary big cta"
          data-testid="quest-action"
          onClick={() => onAction(ch.action)}
        >
          {buttonLabel(ch.action)}
        </button>
      )}
      <div className="mt-4 flex flex-wrap gap-1" aria-label="Route">
        {JOURNEY.map((c, i) => {
          const cls = state.chapters[c.id]
            ? "bg-orange border-orange"
            : i === idx
              ? "border-2 border-orange shadow-[0_0_8px_rgba(245,166,35,.6)] anim-breathe"
              : "bg-[#223047] border-[#2c3a50]";
          return (
            <i
              key={c.id}
              title={c.title}
              className={`block h-3 w-3 rounded-full border ${cls}`}
              data-testid={`route-${c.id}`}
            />
          );
        })}
      </div>
      <p className="mt-3.5 text-[11px] text-muted2">
        {due > 0 && (
          <>
            <b className="text-orange">
              {due} card{due > 1 ? "s" : ""} due
            </b>{" "}
            ·{" "}
          </>
        )}
        Click any lit node to explore it. Scroll to zoom, drag to pan.
      </p>
    </motion.div>
  );
}
