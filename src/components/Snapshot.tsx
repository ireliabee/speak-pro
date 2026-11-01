"use client";

import Modal from "@/components/ui/Modal";
import { LEAVES, NODES } from "@/data/graph";
import { masteryPct, stateOf } from "@/lib/journey";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";

export default function Snapshot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useAppStore();
  const toast = useUiStore((st) => st.toast);
  const mastery = masteryPct(s);
  const lit = LEAVES.filter((n) => stateOf(s, n) !== "locked").length;
  const text = `SpeakPro · ${s.name || "me"} · ${mastery}% mastery · ${s.streak.current}-day streak · ${s.words.length} words · ${lit}/${LEAVES.length} nodes lit`;

  const copy = () => {
    if (!navigator.clipboard) return toast("Copy blocked — select the text instead");
    navigator.clipboard
      .writeText(text)
      .then(() => toast("Copied summary", "good"))
      .catch(() => toast("Copy blocked — select the text instead"));
  };

  return (
    <Modal open={open} onClose={onClose} label="Snapshot" width={520}>
      <div className="text-center">
        <h3 className="m-0 font-serif text-[22px]">{s.name || "My"} communication map</h3>
        <div className="my-2 font-serif text-[56px] leading-none text-orange">{mastery}%</div>
        <svg viewBox="40 60 1450 800" className="h-[220px] w-full" aria-hidden>
          {NODES.filter((n) => n.type === "n").map((n) => {
            const st = stateOf(s, n);
            return (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={n.r * 1.3}
                fill={st === "locked" ? "#1d2634" : n.color}
                opacity={st === "discovered" ? 0.5 : 1}
              />
            );
          })}
        </svg>
        <div className="my-3 flex justify-around">
          {[
            [s.streak.current, "day streak"],
            [s.words.length, "words"],
            [`${lit}/${LEAVES.length}`, "nodes lit"],
          ].map(([v, l]) => (
            <div key={String(l)}>
              <b className="block text-xl">{v}</b>
              <span className="text-[11px] text-muted">{l}</span>
            </div>
          ))}
        </div>
        <div className="mt-[18px] flex justify-center gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn primary" onClick={copy}>
            Copy summary
          </button>
        </div>
      </div>
    </Modal>
  );
}
