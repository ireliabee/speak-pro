"use client";

import { useEffect, useRef, useState } from "react";
import Modal, { ModalFoot, ModalTitle } from "@/components/ui/Modal";
import { NODE_BY_ID } from "@/data/graph";
import { LOOPS, WRITE_FRAMEWORKS } from "@/data/loops";
import { EXCELLENT_THRESHOLD, SUBMIT_THRESHOLD, scoreText, type ScoreResult } from "@/lib/scoring";
import { tweenNumber } from "@/lib/motion";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { useLoopCompletion } from "./useLoopCompletion";

export interface WriteLoopProps {
  open: boolean;
  nodeId?: string | null;
}

export default function WriteLoop({ open, nodeId = null }: WriteLoopProps) {
  const closeModal = useUiStore((s) => s.closeModal);
  const toast = useUiStore((s) => s.toast);
  const submitWrite = useAppStore((s) => s.submitWrite);
  const finish = useLoopCompletion("write");

  const [fw, setFw] = useState<string>(
    nodeId && WRITE_FRAMEWORKS.includes(nodeId) ? nodeId : "jatavia",
  );
  const [text, setText] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const numRef = useRef<HTMLDivElement>(null);

  // Score counts up from 0 (outside React: rAF tween on the DOM node).
  useEffect(() => {
    const el = numRef.current;
    if (!result || !el) return;
    return tweenNumber(0, result.score, 600, (v) => {
      el.textContent = String(Math.round(v));
    });
  }, [result]);

  const score = () => {
    const r = scoreText(text, fw);
    setResult(r);
    if (r.score < SUBMIT_THRESHOLD)
      toast(`Score ${SUBMIT_THRESHOLD}+ to submit — fix the ✗ items.`);
  };

  const submit = () => {
    if (!result || result.score < SUBMIT_THRESHOLD) return;
    const extra = result.score >= EXCELLENT_THRESHOLD ? " (excellent — +1 bonus rep)" : "";
    const res = submitWrite(fw, result.score, result.longw);
    finish(res, `Paragraph scored ${result.score}${extra}`, fw);
  };

  const canSubmit = !!result && result.score >= SUBMIT_THRESHOLD;
  const color = !result
    ? undefined
    : result.score >= 70
      ? "var(--color-green)"
      : result.score >= 40
        ? "var(--color-orange)"
        : "var(--color-red)";

  return (
    <Modal open={open} onClose={closeModal} label="Write one paragraph" testId="write-loop">
      <ModalTitle sub="Pick a framework, write on something you read today, get scored against the rubric.">
        {LOOPS.write.icon} Write one paragraph
      </ModalTitle>
      <div className="my-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Framework">
        {WRITE_FRAMEWORKS.map((f) => (
          <button
            type="button"
            key={f}
            role="radio"
            aria-checked={f === fw}
            className={`pill${f === fw ? " on" : ""}`}
            onClick={() => {
              setFw(f);
              setResult(null);
            }}
          >
            {NODE_BY_ID[f]?.fw}
          </button>
        ))}
      </div>
      <p className="m-0 mt-1 text-xs text-muted">{NODE_BY_ID[fw]?.prompt ?? ""}</p>
      <label className="mb-1 mt-2.5 block text-xs text-muted" htmlFor="wr-text">
        Your paragraph
      </label>
      <textarea
        id="wr-text"
        className="field"
        autoFocus
        placeholder="Write here…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
      />
      {result && (
        <div
          className="anim-pop mt-3 flex items-center gap-4 rounded-[14px] border border-line bg-bg2 p-3.5"
          data-testid="write-score"
        >
          <div
            ref={numRef}
            className="font-serif text-[40px] font-semibold leading-none"
            style={{ color }}
            data-testid="write-score-value"
            data-score={result.score}
          >
            {result.score}
          </div>
          <ul className="m-0 list-disc pl-4 text-xs text-ink2">
            {result.checks.map((c, i) => (
              <li
                key={c.txt}
                className={c.ok ? "check-ok text-green" : "check-no text-red"}
                style={{ animationDelay: `${c.ok ? i * 50 : 0}ms` }}
                data-ok={c.ok ? "true" : "false"}
              >
                {c.ok ? "✓" : "✗"} {c.txt}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ModalFoot>
        <button type="button" className="btn" onClick={closeModal}>
          Cancel
        </button>
        <button type="button" className="btn" onClick={score}>
          Score it
        </button>
        <button type="button" className="btn primary" disabled={!canSubmit} onClick={submit}>
          Submit
        </button>
      </ModalFoot>
    </Modal>
  );
}
