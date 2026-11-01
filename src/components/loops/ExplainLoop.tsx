"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal, { ModalFoot, ModalTitle } from "@/components/ui/Modal";
import { NODE_BY_ID } from "@/data/graph";
import { EXPLAIN_CONCEPTS, LOOPS } from "@/data/loops";
import { playLoopTone } from "@/lib/audio";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { useLoopCompletion } from "./useLoopCompletion";

export const SESSION_SECONDS = 120;
/** "Done" unlocks once at least this many seconds have been spoken. */
export const MIN_SPOKEN_SECONDS = 30;
/** The ring pulses amber for the last 15 s. */
export const URGENT_SECONDS = 15;

const CHECKS = [
  "I used no jargon I couldn’t define",
  "I gave one analogy or example",
  "I didn’t get stuck — if I did, I know what to re-learn",
];

export interface ExplainLoopProps {
  open: boolean;
  nodeId?: string | null;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function ExplainLoop({ open, nodeId = null }: ExplainLoopProps) {
  const closeModal = useUiStore((s) => s.closeModal);
  const toast = useUiStore((s) => s.toast);
  const submitExplain = useAppStore((s) => s.submitExplain);
  const finish = useLoopCompletion("explain");

  const initial = useMemo(
    () =>
      nodeId && EXPLAIN_CONCEPTS.includes(nodeId)
        ? nodeId
        : EXPLAIN_CONCEPTS[Math.floor(Math.random() * EXPLAIN_CONCEPTS.length)]!,
    [nodeId],
  );
  const [concept, setConcept] = useState(initial);
  const [left, setLeft] = useState(SESSION_SECONDS);
  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(CHECKS.map(() => false));
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (iv.current) clearInterval(iv.current);
    iv.current = null;
    setRunning(false);
  };

  useEffect(() => () => stop(), []);

  const start = () => {
    stop();
    setRunning(true);
    iv.current = setInterval(() => {
      setLeft((l) => {
        const n = l - 1;
        if (n <= 0) {
          stop();
          setEnded(true);
          if (useAppStore.getState().sound) playLoopTone("explain");
          toast("Two minutes — stop there.");
          return 0;
        }
        return n;
      });
    }, 1000);
  };

  const spoken = SESSION_SECONDS - left;
  const canSubmit = spoken >= MIN_SPOKEN_SECONDS;

  const submit = () => {
    stop();
    const n = checks.filter(Boolean).length;
    const res = submitExplain(concept, n);
    finish(
      res,
      `Explained ${NODE_BY_ID[concept]?.fw} · ${n}/3 Feynman checks${n === 3 ? " · bonus rep" : ""}`,
      concept,
    );
  };

  const close = () => {
    stop();
    closeModal();
  };

  return (
    <Modal open={open} onClose={close} label="Explain aloud" testId="explain-loop">
      <ModalTitle sub="Explain the concept out loud to an imaginary 12-year-old in under two minutes. Then be honest with the three Feynman checks.">
        {LOOPS.explain.icon} Explain aloud
      </ModalTitle>
      <div className="my-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Concept">
        {EXPLAIN_CONCEPTS.map((c) => (
          <button
            type="button"
            key={c}
            role="radio"
            aria-checked={c === concept}
            className={`pill${c === concept ? " on" : ""}`}
            onClick={() => setConcept(c)}
          >
            {NODE_BY_ID[c]?.fw}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2.5 py-2.5">
        <svg viewBox="0 0 120 120" className="h-40 w-40" aria-hidden>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#223047" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--color-orange)"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - left / SESSION_SECONDS}
            transform="rotate(-90 60 60)"
            className={`timer-ring${running && left <= URGENT_SECONDS ? " urgent" : ""}`}
            data-state={running && left <= URGENT_SECONDS ? "urgent" : running ? "running" : "idle"}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="font-serif text-[28px]" data-testid="explain-timer" aria-live="polite">
          {fmt(left)}
        </div>
        <button type="button" className="btn primary" onClick={start} disabled={running || ended}>
          {ended ? "Time" : running ? "Speaking…" : "Start"}
        </button>
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        {CHECKS.map((label, i) => (
          <label
            key={label}
            className="m-0 flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-line p-2.5 text-[13px] text-ink"
          >
            <input
              type="checkbox"
              checked={checks[i]}
              onChange={(e) =>
                setChecks((arr) => arr.map((v, j) => (j === i ? e.target.checked : v)))
              }
            />
            {label}
          </label>
        ))}
      </div>
      <ModalFoot>
        <button type="button" className="btn" onClick={close}>
          Cancel
        </button>
        <button type="button" className="btn primary" disabled={!canSubmit} onClick={submit}>
          Done
        </button>
      </ModalFoot>
    </Modal>
  );
}
