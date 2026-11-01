"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useUiStore } from "@/store/useUiStore";

const TOAST_MS = 2800;

function ToastItem({ id, msg, kind }: { id: number; msg: string; kind?: "good" }) {
  const dismiss = useUiStore((s) => s.dismissToast);
  useEffect(() => {
    const t = setTimeout(() => dismiss(id), TOAST_MS);
    return () => clearTimeout(t);
  }, [id, dismiss]);
  return (
    <motion.div
      role="status"
      className={`rounded-xl border border-line bg-panel px-3.5 py-2.5 text-[13px] shadow-[0_10px_30px_rgba(0,0,0,.4)] ${
        kind === "good" ? "border-l-[3px] border-l-green" : "border-l-[3px] border-l-orange"
      }`}
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {msg}
    </motion.div>
  );
}

export default function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed left-1/2 top-[70px] z-[70] flex -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
