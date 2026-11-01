"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible label for the dialog. */
  label: string;
  width?: number;
  testId?: string;
}

export default function Modal({ open, onClose, children, label, width = 640, testId }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,8,14,.6)] backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            data-testid={testId}
            className="scrollbar-thin max-h-[88vh] overflow-auto rounded-[20px] border border-line bg-panel p-6 shadow-[0_30px_80px_rgba(0,0,0,.5)]"
            style={{ width: `min(${width}px, 92vw)` }}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <>
      <h2 className="m-0 mb-1 font-serif text-2xl font-semibold">{children}</h2>
      {sub && <div className="mb-4 text-[13px] text-muted">{sub}</div>}
    </>
  );
}

export function ModalFoot({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <div className={`mt-[18px] flex gap-2 ${center ? "justify-center" : "justify-end"}`}>
      {children}
    </div>
  );
}
