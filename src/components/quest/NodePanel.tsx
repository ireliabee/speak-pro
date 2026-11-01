"use client";

import { motion } from "framer-motion";
import {
  HUB_OF,
  NODE_BY_ID,
  PATH,
  type DisciplineId,
  type GraphNode,
  type LoopId,
} from "@/data/graph";
import { LOOPS } from "@/data/loops";
import { masteryPct, reps, stateOf } from "@/lib/journey";
import { useAppStore } from "@/store/useAppStore";

export interface NodePanelProps {
  node: GraphNode;
  onBack: () => void;
  onPractise: (loop: LoopId, nodeId: string) => void;
  onSetDiscipline: (id: DisciplineId) => void;
}

export default function NodePanel({
  node: n,
  onBack,
  onPractise,
  onSetDiscipline,
}: NodePanelProps) {
  const progress = useAppStore((s) => s.progress);
  const discovered = useAppStore((s) => s.discovered);
  const disc = useAppStore((s) => s.disc);
  const s = { progress, discovered };
  const st = stateOf(s, n);
  const r = reps(s, n.id);
  const mastery = masteryPct(s);

  return (
    <motion.div
      data-testid="node-panel"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <button type="button" className="btn sm ghost" onClick={onBack}>
        ← Back to quest
      </button>
      <h2 className="mb-1.5 mt-2.5 font-serif text-xl font-semibold">{n.fw || n.orig}</h2>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {n.hl && <span className="tag hl">critical path</span>}
        {n.type === "n" ? (
          <span className={`tag state-${st}`}>{st}</span>
        ) : n.type === "c" ? (
          <span className="tag">group</span>
        ) : (
          <span className="tag">hub</span>
        )}
        {n.loop && <span className="tag">{LOOPS[n.loop].title}</span>}
      </div>
      {n.desc && <p className="mb-2.5 text-[13px] leading-[1.55] text-ink2">{n.desc}</p>}
      {n.type === "n" && !n.root && (
        <>
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Reps</span>
            <span>{r} / 10</span>
          </div>
          <div className="meter mb-3.5">
            <i style={{ width: `${Math.min(r, 10) * 10}%` }} />
          </div>
          {n.loop && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn primary"
                onClick={() => onPractise(n.loop as LoopId, n.id)}
              >
                {LOOPS[n.loop].icon} Practise now
              </button>
            </div>
          )}
        </>
      )}
      {n.root && (
        <>
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Map mastery</span>
            <span>{mastery}%</span>
          </div>
          <div className="meter mb-3.5">
            <i style={{ width: `${mastery}%` }} />
          </div>
          <p className="mb-1 text-[13px]">
            <b>Critical path</b>
          </p>
          <ul className="mb-3 mt-1 list-disc pl-[18px] text-[13px] text-ink2">
            {PATH.map((k) => {
              const pn = NODE_BY_ID[k]!;
              const locked = stateOf(s, pn) === "locked";
              return (
                <li key={k} className={`my-[3px] ${locked ? "text-muted2" : ""}`}>
                  {pn.fw}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {n.children && (
        <>
          <p className="mb-1 text-[13px]">
            <b>Inside this group</b>
          </p>
          <ul className="mb-3 mt-1 list-disc pl-[18px] text-[13px] text-ink2">
            {n.children.map((c) => (
              <li key={c} className="my-[3px]">
                {c}
              </li>
            ))}
          </ul>
          {n.disc && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn${disc === n.disc ? "" : " primary"}`}
                data-testid="set-discipline"
                onClick={() => onSetDiscipline(n.disc as DisciplineId)}
              >
                {disc === n.disc ? "Current discipline" : "Make this my discipline"}
              </button>
            </div>
          )}
        </>
      )}
      {n.type === "hub" && (
        <>
          <p className="mb-1 text-[13px]">
            <b>Connected ({(HUB_OF[n.id] ?? []).length})</b>
          </p>
          <div className="mt-2.5 flex flex-col gap-2">
            {(HUB_OF[n.id] ?? []).map((k) => {
              const kn = NODE_BY_ID[k]!;
              return (
                <div
                  key={k}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-bg2 p-2.5 text-[13px]"
                >
                  <span
                    className="h-2.5 w-2.5 flex-none rounded-full"
                    style={{ background: kn.color ?? "#3a4a63" }}
                  />
                  <span className="flex-1">{kn.fw || kn.orig}</span>
                  {kn.type === "n" && (
                    <span className="text-[11px] text-muted">{stateOf(s, kn)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      <div className="mt-4 text-[11px] text-muted2">
        Image label: <b>{n.orig}</b>
      </div>
    </motion.div>
  );
}
