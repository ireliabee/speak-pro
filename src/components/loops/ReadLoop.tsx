"use client";

import { useState } from "react";
import Modal, { ModalFoot, ModalTitle } from "@/components/ui/Modal";
import { LOOPS } from "@/data/loops";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { useLoopCompletion } from "./useLoopCompletion";

export const MIN_WORDS = 3;
const ROWS = [0, 1, 2, 3, 4];

export interface ReadLoopProps {
  open: boolean;
  nodeId?: string | null;
}

export default function ReadLoop({ open, nodeId = null }: ReadLoopProps) {
  const closeModal = useUiStore((s) => s.closeModal);
  const toast = useUiStore((s) => s.toast);
  const addWords = useAppStore((s) => s.addWords);
  const completeLoop = useAppStore((s) => s.completeLoop);
  const finish = useLoopCompletion();

  const [src, setSrc] = useState("");
  const [words, setWords] = useState<string[]>(ROWS.map(() => ""));
  const [sentences, setSentences] = useState<string[]>(ROWS.map(() => ""));

  const setAt = (setter: typeof setWords, i: number, v: string) =>
    setter((arr) => arr.map((x, j) => (j === i ? v : x)));

  const submit = () => {
    const entries = ROWS.map((i) => ({
      w: (words[i] ?? "").trim(),
      s: (sentences[i] ?? "").trim(),
    })).filter((x) => x.w);
    if (entries.length < MIN_WORDS) {
      toast(`Log at least ${MIN_WORDS} words to count the session.`);
      return;
    }
    const n = addWords(entries, src.trim());
    const result = completeLoop("read", nodeId);
    finish(result, `${n} words logged → ${n} cards created`);
  };

  return (
    <Modal open={open} onClose={closeModal} label="Read and log" testId="read-loop">
      <ModalTitle sub="Read 30 minutes in a discipline outside your own, then log five words — each with the sentence it lived in. They become cards automatically.">
        {LOOPS.read.icon} Read &amp; log
      </ModalTitle>
      <label className="mb-1 mt-2.5 block text-xs text-muted" htmlFor="rd-src">
        What did you read?
      </label>
      <input
        id="rd-src"
        className="field"
        placeholder="e.g. a Lancet editorial, a Supreme Court opinion…"
        value={src}
        onChange={(e) => setSrc(e.target.value)}
      />
      <label className="mb-1 mt-2.5 block text-xs text-muted">Five words</label>
      {ROWS.map((i) => (
        <div
          key={i}
          className="anim-pop mb-2 grid grid-cols-[1fr_2fr] gap-2"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <input
            className="field"
            placeholder={`word ${i + 1}`}
            aria-label={`word ${i + 1}`}
            value={words[i]}
            onChange={(e) => setAt(setWords, i, e.target.value)}
          />
          <input
            className="field"
            placeholder="the sentence it appeared in"
            aria-label={`sentence ${i + 1}`}
            value={sentences[i]}
            onChange={(e) => setAt(setSentences, i, e.target.value)}
          />
        </div>
      ))}
      <ModalFoot>
        <button type="button" className="btn" onClick={closeModal}>
          Cancel
        </button>
        <button type="button" className="btn primary" onClick={submit}>
          Log words
        </button>
      </ModalFoot>
    </Modal>
  );
}
