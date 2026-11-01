"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const STEPS = [
  {
    pos: { left: "40%", top: "40%" },
    title: "This is your map",
    body: "Every node is a skill. Dark nodes are locked; they light up as you practise. The fog clears chapter by chapter.",
  },
  {
    pos: { right: "380px", top: "80px" },
    title: "This is your quest",
    body: "The panel always shows one chapter: a short lesson, one objective, one button. You never have to decide what to do next.",
  },
  {
    pos: { left: "40%", top: "40%" },
    title: "Follow the beacon",
    body: "The pulsing NEXT marker shows where you are on the route. Finish the objective → the node lights → the next one appears.",
  },
] as const;

export interface TutorialProps {
  open: boolean;
  onDone: () => void;
}

export default function Tutorial({ open, onDone }: TutorialProps) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  return (
    <AnimatePresence>
      {open && step && (
        <div className="pointer-events-none fixed inset-0 z-[55]" data-testid="tutorial">
          <motion.div
            key={i}
            className="pointer-events-auto absolute max-w-[280px] rounded-[14px] border border-orange bg-panel px-4 py-3.5 text-[13px] leading-[1.5] shadow-[0_20px_60px_rgba(0,0,0,.6)]"
            style={step.pos}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <b className="mb-1 block font-serif text-[17px]">{step.title}</b>
            {step.body}
            <div className="mt-2.5 flex gap-2">
              <button type="button" className="btn sm ghost" onClick={onDone}>
                Skip
              </button>
              <button
                type="button"
                className="btn sm primary"
                onClick={() => (i === STEPS.length - 1 ? onDone() : setI(i + 1))}
              >
                {i === STEPS.length - 1 ? "Got it" : "Next"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
