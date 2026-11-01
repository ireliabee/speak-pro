"use client";

import { useEffect, useMemo, useState } from "react";
import Modal, { ModalFoot, ModalTitle } from "@/components/ui/Modal";
import { LOOPS } from "@/data/loops";
import { buildDeck, dueCards, type Rating } from "@/lib/srs";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { useLoopCompletion } from "./useLoopCompletion";

export interface ReviewLoopProps {
  open: boolean;
}

const RATINGS: Array<{ r: Rating; label: string; primary?: boolean }> = [
  { r: 0, label: "Again" },
  { r: 1, label: "Hard" },
  { r: 2, label: "Good" },
  { r: 3, label: "Easy", primary: true },
];

export default function ReviewLoop({ open }: ReviewLoopProps) {
  const closeModal = useUiStore((s) => s.closeModal);
  const openLoop = useUiStore((s) => s.openLoop);
  const cards = useAppStore((s) => s.cards);
  const rateCard = useAppStore((s) => s.rateCard);
  const completeLoop = useAppStore((s) => s.completeLoop);
  const finish = useLoopCompletion();

  // Deck is frozen when the modal opens so ratings don't reshuffle it mid-session.
  const deck = useMemo(() => (open ? buildDeck(cards) : []), [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (open) {
      setI(0);
      setFlip(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && deck.length && i >= deck.length) {
      const result = completeLoop("review", null);
      finish(result, `Reviewed ${deck.length} cards`);
    }
  }, [open, deck.length, i, completeLoop, finish]);

  const rate = (r: Rating) => {
    const c = deck[i];
    if (!c) return;
    rateCard(c.w, r);
    setFlip(false);
    setI(i + 1);
  };

  const card = deck[i];
  const due = dueCards(cards).length;

  return (
    <Modal open={open} onClose={closeModal} label="Review deck" testId="review-loop">
      {!deck.length ? (
        <>
          <ModalTitle sub="No cards yet. Log words in the Read step and they'll appear here on a Leitner schedule.">
            {LOOPS.review.icon} Review deck
          </ModalTitle>
          <ModalFoot>
            <button type="button" className="btn" onClick={closeModal}>
              Close
            </button>
            <button type="button" className="btn primary" onClick={() => openLoop("read")}>
              Go read
            </button>
          </ModalFoot>
        </>
      ) : card ? (
        <>
          <ModalTitle sub={`Card ${i + 1} of ${deck.length} · box ${card.box}/5 · ${due} due`}>
            {LOOPS.review.icon} Review deck
          </ModalTitle>
          <div
            className={`card3d${flip ? " flip" : ""}`}
            onClick={() => setFlip((f) => !f)}
            role="button"
            aria-pressed={flip}
            aria-label="Flip card"
            data-testid="review-card"
          >
            <div className="in">
              <div className="f">{card.w}</div>
              <div className="b">
                <div>
                  {card.s || "(no sentence logged)"}
                  <br />
                  <br />
                  <span className="text-xs text-muted">
                    Define it, then use it in a new sentence aloud.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {RATINGS.map(({ r, label, primary }) => (
              <button
                type="button"
                key={r}
                className={`btn text-center${primary ? " primary" : ""}`}
                onClick={() => rate(r)}
              >
                {label}
              </button>
            ))}
          </div>
          <ModalFoot>
            <button type="button" className="btn ghost" onClick={closeModal}>
              Stop
            </button>
          </ModalFoot>
        </>
      ) : (
        <ModalTitle>{LOOPS.review.icon} Finishing…</ModalTitle>
      )}
    </Modal>
  );
}
