"use client";

import Modal from "@/components/ui/Modal";
import type { Chapter } from "@/data/journey";
import { levelOf } from "@/lib/journey";
import { useAppStore } from "@/store/useAppStore";

export interface CelebrationProps {
  open: boolean;
  chapter: Chapter | null;
  next: Chapter | null;
  onContinue: () => void;
}

export default function Celebration({ open, chapter, next, onContinue }: CelebrationProps) {
  const xp = useAppStore((s) => s.xp);
  const lv = levelOf(xp);
  return (
    <Modal
      open={open && !!chapter}
      onClose={onContinue}
      label="Chapter complete"
      testId="celebration"
    >
      {chapter && (
        <div className="py-2.5 text-center">
          <div className="cele-badge mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-orange text-[36px] font-extrabold text-[#1a1200] shadow-[0_0_40px_rgba(245,166,35,.5)]">
            ✓
          </div>
          <div className="text-[11px] uppercase tracking-[.1em] text-muted">Chapter complete</div>
          <h2 className="my-1 font-serif text-[30px] font-semibold" data-testid="celebration-title">
            {chapter.title}
          </h2>
          <div className="mb-2 text-base font-bold text-orange">
            +{chapter.xp} XP · {lv.name}
          </div>
          <p className="text-sm text-ink2">
            {next ? (
              <>
                Next: <b>{next.title}</b> — {next.objective}
              </>
            ) : (
              "You finished the journey."
            )}
          </p>
          <div className="mt-[18px] flex justify-center">
            <button
              type="button"
              className="btn primary big"
              onClick={onContinue}
              data-testid="celebration-continue"
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
