"use client";

import { useEffect, useRef, useState } from "react";
import type { LabelMode } from "@/store/state";
import { levelOf, masteryPct } from "@/lib/journey";
import { tweenNumber } from "@/lib/motion";
import { dueCards } from "@/lib/srs";
import { pathWarm } from "@/lib/dates";
import { useAppStore } from "@/store/useAppStore";

export interface TopBarProps {
  onSnapshot: () => void;
  onReset: () => void;
}

function Stat({ value, label, testId }: { value: string | number; label: string; testId: string }) {
  return (
    <div className="flex flex-col items-end leading-[1.1]">
      <b className="text-base" data-testid={testId}>
        {value}
      </b>
      <span className="text-[10px] uppercase tracking-[.08em] text-muted">{label}</span>
    </div>
  );
}

/** XP rolls up with a tween and the level bar fills; a level-up sweeps light across. */
function XpMeter() {
  const xp = useAppStore((s) => s.xp);
  const numRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const prev = useRef(xp);
  const [sweep, setSweep] = useState(0);
  const lv = levelOf(xp);
  const pct = lv.next ? Math.round(((xp - lv.from) / (lv.next.xp - lv.from)) * 100) : 100;

  useEffect(() => {
    const from = prev.current;
    prev.current = xp;
    if (levelOf(from).name !== lv.name && xp > from) setSweep((n) => n + 1);
    const num = numRef.current;
    const bar = barRef.current;
    const cancel = tweenNumber(from, xp, 700, (v) => {
      if (num) num.textContent = String(Math.round(v));
    });
    if (bar) bar.style.width = `${pct}%`;
    return cancel;
  }, [xp, lv.name, pct]);

  return (
    <div
      className="flex flex-col items-end leading-[1.1]"
      data-testid="xp-meter"
      data-level={lv.name}
    >
      <b className="text-base">
        <span ref={numRef} data-testid="stat-xp">
          {xp}
        </span>{" "}
        <span className="text-[10px] font-normal uppercase tracking-[.08em] text-orange">
          {lv.name}
        </span>
      </b>
      <span className="mt-1 block h-[3px] w-[72px] overflow-hidden rounded-sm bg-[#223047]">
        <i
          ref={barRef}
          className="block h-full bg-orange transition-[width] duration-[600ms]"
          style={{ width: `${pct}%` }}
        />
      </span>
      {sweep > 0 && (
        <div key={sweep} className="light-sweep" data-testid="level-sweep" aria-hidden />
      )}
    </div>
  );
}

export default function TopBar({ onSnapshot, onReset }: TopBarProps) {
  const sound = useAppStore((s) => s.sound);
  const setSound = useAppStore((s) => s.setSound);
  const progress = useAppStore((s) => s.progress);
  const words = useAppStore((s) => s.words);
  const cards = useAppStore((s) => s.cards);
  const streak = useAppStore((s) => s.streak);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const warm = pathWarm(streak.last);

  const modes: Array<{ id: LabelMode; label: string }> = [
    { id: "fw", label: "Framework" },
    { id: "orig", label: "Image names" },
  ];

  return (
    <header className="flex items-center gap-3.5 border-b border-line bg-gradient-to-b from-[#0f1521] to-[#0b0f17] px-[18px]">
      <div className="flex items-center gap-2 font-serif text-xl tracking-[-.01em]">
        <i className="anim-breathe inline-block h-2.5 w-2.5 rounded-full bg-orange shadow-[0_0_14px_var(--color-orange)]" />
        SpeakPro
        <span className="ml-1 text-[10px] font-sans uppercase tracking-[.12em] text-muted2">
          by iReliabee
        </span>
      </div>
      <div
        className="flex overflow-hidden rounded-[10px] border border-line"
        role="radiogroup"
        aria-label="Label mode"
      >
        {modes.map((m) => (
          <button
            type="button"
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            className={`cursor-pointer border-0 px-[11px] py-[7px] text-xs ${
              mode === m.id ? "bg-[#1f2a3c] text-ink" : "bg-transparent text-muted"
            }`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <XpMeter />
      <Stat value={`${masteryPct({ progress })}%`} label="mastery" testId="stat-mastery" />
      <Stat value={words.length} label="words" testId="stat-words" />
      <Stat value={dueCards(cards).length} label="due cards" testId="stat-due" />
      <div
        className="flex items-center gap-2 rounded-full border border-line bg-bg2 px-3 py-1.5"
        data-testid="streak"
      >
        <span
          className={`text-base ${warm ? "drop-shadow-[0_0_6px_rgba(245,166,35,.6)]" : "opacity-50 grayscale"}`}
          aria-hidden
        >
          🔥
        </span>
        <b data-testid="stat-streak">{streak.current}</b>
        <span className="text-[11px] text-muted">day streak</span>
      </div>
      <button
        type="button"
        className="btn sm"
        role="switch"
        aria-checked={sound}
        aria-label="Reward tones"
        title={sound ? "Reward tones on" : "Reward tones off"}
        data-testid="sound-toggle"
        onClick={() => setSound(!sound)}
      >
        {sound ? "🔔" : "🔕"}
      </button>
      <button type="button" className="btn" onClick={onSnapshot}>
        Snapshot
      </button>
      <button type="button" className="btn ghost sm" title="Reset all progress" onClick={onReset}>
        Reset
      </button>
    </header>
  );
}
