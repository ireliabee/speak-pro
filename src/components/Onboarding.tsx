"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { DISCIPLINE_IDS, DISCIPLINES } from "@/data/disciplines";
import type { DisciplineId } from "@/data/graph";
import { JOURNEY } from "@/data/journey";

export interface OnboardingProps {
  open: boolean;
  onBegin: (name: string, discipline: DisciplineId | null) => void;
}

const pop = (delay: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] as const },
});

export default function Onboarding({ open, onBegin }: OnboardingProps) {
  const [name, setName] = useState("");
  const [disc, setDisc] = useState<DisciplineId | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-bg"
          data-testid="onboarding"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-[min(560px,92vw)] text-center">
            <motion.h1
              className="m-0 mb-2 font-serif text-[44px] font-semibold tracking-[-.02em]"
              {...pop(0)}
            >
              Light up your map.
            </motion.h1>
            <motion.p className="text-[15px] leading-[1.6] text-muted" {...pop(0.12)}>
              SpeakPro turns the elite-communication framework into a journey: {JOURNEY.length}{" "}
              chapters along one route. Each chapter teaches one framework and gives you one thing
              to do. Finish it and the node lights up; the next one appears.
            </motion.p>
            <motion.input
              className="w-full rounded-xl border border-line bg-bg2 px-3.5 py-3 text-center text-[15px] text-ink outline-none focus:border-orange"
              placeholder="Your first name"
              maxLength={24}
              aria-label="Your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              {...pop(0.18)}
            />
            <p className="mt-3.5 text-xs text-muted">Pick your primary discipline</p>
            <motion.div
              className="my-[18px] grid grid-cols-3 gap-2"
              role="radiogroup"
              aria-label="Primary discipline"
              {...pop(0.24)}
            >
              {DISCIPLINE_IDS.map((id) => (
                <button
                  type="button"
                  key={id}
                  role="radio"
                  aria-checked={disc === id}
                  className={`pill p-3 text-[13px]${disc === id ? " on" : ""}`}
                  onClick={() => setDisc(disc === id ? null : id)}
                >
                  {DISCIPLINES[id].name}
                </button>
              ))}
            </motion.div>
            <button
              type="button"
              className="btn primary px-[22px] py-3 text-[15px]"
              data-testid="onboarding-begin"
              onClick={() => onBegin(name.trim(), disc)}
            >
              Begin
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
