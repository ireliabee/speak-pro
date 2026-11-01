"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import SkillMap from "@/components/map/SkillMap";
import QuestPanel from "@/components/quest/QuestPanel";
import NodePanel from "@/components/quest/NodePanel";
import ReadLoop from "@/components/loops/ReadLoop";
import WriteLoop from "@/components/loops/WriteLoop";
import ExplainLoop from "@/components/loops/ExplainLoop";
import ReviewLoop from "@/components/loops/ReviewLoop";
import Celebration from "@/components/Celebration";
import Onboarding from "@/components/Onboarding";
import RitualBar from "@/components/RitualBar";
import TopBar from "@/components/TopBar";
import Tutorial from "@/components/Tutorial";
import Snapshot from "@/components/Snapshot";
import Modal, { ModalFoot, ModalTitle } from "@/components/ui/Modal";
import Toasts from "@/components/ui/Toasts";
import { COLORS, NODE_BY_ID, type DisciplineId, type GraphNode, type LoopId } from "@/data/graph";
import { DISCIPLINES } from "@/data/disciplines";
import { JOURNEY, type ChapterAction } from "@/data/journey";
import { chapterIndex } from "@/lib/journey";
import { REWARD } from "@/components/map/SkillMap";
import { dayDiff, pathWarm, todayISO } from "@/lib/dates";
import { useAppStore, useHydrated } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";

export default function App() {
  const hydrated = useHydrated();
  const onboarded = useAppStore((s) => s.onboarded);
  const tutorialDone = useAppStore((s) => s.tutorial);
  const chapters = useAppStore((s) => s.chapters);
  const onboard = useAppStore((s) => s.onboard);
  const setTutorialDone = useAppStore((s) => s.setTutorialDone);
  const toggleExpanded = useAppStore((s) => s.toggleExpanded);
  const discoverNode = useAppStore((s) => s.discoverNode);
  const markRootMet = useAppStore((s) => s.markRootMet);
  const setDiscipline = useAppStore((s) => s.setDiscipline);
  const checkChapters = useAppStore((s) => s.checkChapters);
  const coolStreakIfStale = useAppStore((s) => s.coolStreakIfStale);
  const reset = useAppStore((s) => s.reset);

  const modal = useUiStore((s) => s.modal);
  const focusedId = useUiStore((s) => s.focusedId);
  const focus = useUiStore((s) => s.focus);
  const openLoop = useUiStore((s) => s.openLoop);
  const openModal = useUiStore((s) => s.openModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const openCelebration = useUiStore((s) => s.openCelebration);
  const send = useUiStore((s) => s.send);
  const toast = useUiStore((s) => s.toast);
  const setPulseSlot = useUiStore((s) => s.setPulseSlot);

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [asideOpen, setAsideOpen] = useState(false);
  const booted = useRef(false);

  /** Completes the current chapter when its check passes and plays the celebration. */
  const tryAdvance = useCallback(() => {
    const ch = checkChapters();
    if (!ch) return false;
    const idx = JOURNEY.findIndex((c) => c.id === ch.id);
    send({ type: "reward", id: ch.node, color: COLORS.orange });
    setTimeout(() => openCelebration(ch, JOURNEY[idx + 1] ?? null), REWARD.total);
    return true;
  }, [checkChapters, send, openCelebration]);

  // Boot: streak messages once the persisted state is in.
  useEffect(() => {
    if (!hydrated || !onboarded || booted.current) return;
    booted.current = true;
    const { streak } = useAppStore.getState();
    if (streak.last && !pathWarm(streak.last)) {
      const gap = coolStreakIfStale();
      setTimeout(() => {
        send({ type: "coolDown" });
        toast(`The path cooled — ${gap} days since your last step. One step relights it.`);
      }, 1600);
      setTimeout(() => setPulseSlot("read"), 1600 + 2500);
      setTimeout(() => setPulseSlot(null), 1600 + 2500 + 4500);
    } else if (streak.last && dayDiff(streak.last, todayISO()) === 1) {
      setTimeout(() => toast(`Streak at ${streak.current}. Do one step today to keep it.`), 1600);
    }
  }, [hydrated, onboarded, coolStreakIfStale, send, toast, setPulseSlot]);

  // Push the camera in (and blur the map) whenever a loop modal opens.
  const pushed = modal.kind === "loop";
  const pushTarget = modal.kind === "loop" ? modal.nodeId : null;
  useEffect(() => {
    if (pushed) send({ type: "pushIn", id: pushTarget });
  }, [pushed, pushTarget, send]);

  const onNodeClick = useCallback(
    (n: GraphNode) => {
      if (n.root) markRootMet();
      if (n.type === "c") toggleExpanded(n.id);
      if (n.type === "n" && discoverNode(n.id)) toast(`Discovered: ${n.fw}`);
      focus(n.id);
      setAsideOpen(true);
      send({ type: "zoomTo", id: n.id });
      setTimeout(tryAdvance, 300);
    },
    [markRootMet, toggleExpanded, discoverNode, toast, focus, send, tryAdvance],
  );

  const backToQuest = useCallback(() => focus(null), [focus]);

  const onSetDiscipline = useCallback(
    (id: DisciplineId) => {
      const added = setDiscipline(id);
      toast(
        `${DISCIPLINES[id].name} pack loaded${added ? ` · ${added} glossary words seeded` : ""}`,
        "good",
      );
      send({ type: "burst", ids: [id], color: COLORS.purple });
      setTimeout(tryAdvance, 400);
    },
    [setDiscipline, toast, send, tryAdvance],
  );

  const onQuestAction = useCallback(
    (a: ChapterAction) => {
      switch (a.type) {
        case "focus":
          onNodeClick(NODE_BY_ID[a.node]!);
          break;
        case "disc":
          send({ type: "zoomTo", id: "hubBig", width: 1150 });
          toast("Click one of the six “+” discipline nodes, then “Make this my discipline”");
          break;
        case "loop":
          openLoop(a.loop, a.node ?? null);
          break;
      }
    },
    [onNodeClick, send, toast, openLoop],
  );

  const onBegin = useCallback(
    (name: string, disc: DisciplineId | null) => {
      onboard(name);
      if (!tutorialDone) setTimeout(() => setTutorialOpen(true), 2300);
      if (disc) setTimeout(() => onSetDiscipline(disc), 1800);
    },
    [onboard, tutorialDone, onSetDiscipline],
  );

  const onCelebrationContinue = useCallback(() => {
    closeModal();
    const ch = JOURNEY[chapterIndex(useAppStore.getState())]!;
    focus(null);
    send({ type: "zoomTo", id: ch.node });
  }, [closeModal, focus, send]);

  const openLoopFromStrip = useCallback((loop: LoopId) => openLoop(loop, null), [openLoop]);

  const focusedNode = focusedId ? NODE_BY_ID[focusedId] : undefined;
  const loopOpen = (l: LoopId) => modal.kind === "loop" && modal.loop === l;
  const loopNode = modal.kind === "loop" ? modal.nodeId : null;

  if (!hydrated) {
    return <div className="h-screen w-screen bg-bg" aria-busy="true" data-testid="booting" />;
  }

  return (
    <div
      className="grid h-screen grid-rows-[56px_1fr]"
      data-testid="app"
      data-chapters={Object.keys(chapters).length}
    >
      <TopBar
        onSnapshot={() => openModal({ kind: "snapshot" })}
        onReset={() => openModal({ kind: "reset" })}
      />
      <div className="relative grid min-h-0 grid-cols-[1fr_360px] max-[900px]:grid-cols-1">
        <div
          className={`stage relative overflow-hidden${pushed ? " pushed" : ""}`}
          data-pushed={pushed ? "true" : undefined}
        >
          <div className="absolute left-4 top-3.5 z-[4] flex items-center gap-2">
            <Hud />
            <button type="button" className="btn sm ghost" onClick={() => send({ type: "fit" })}>
              Fit
            </button>
          </div>
          <SkillMap onNodeClick={onNodeClick} onBackgroundClick={backToQuest} />
          <div className="vignette" aria-hidden />
          <RitualBar onOpenLoop={openLoopFromStrip} />
          <div className="absolute bottom-4 right-4 z-[4] flex flex-col gap-1.5">
            <button
              type="button"
              className="btn px-2.5 py-1.5 text-sm"
              aria-label="Zoom in"
              onClick={() => send({ type: "zoomBy", factor: 0.75 })}
            >
              +
            </button>
            <button
              type="button"
              className="btn px-2.5 py-1.5 text-sm"
              aria-label="Zoom out"
              onClick={() => send({ type: "zoomBy", factor: 1.33 })}
            >
              −
            </button>
          </div>
        </div>
        <aside
          className={`scrollbar-thin relative overflow-auto border-l border-line bg-panel max-[900px]:absolute max-[900px]:bottom-0 max-[900px]:right-0 max-[900px]:top-0 max-[900px]:w-[min(360px,100%)] max-[900px]:transition-transform ${
            asideOpen ? "" : "max-[900px]:translate-x-full"
          }`}
          data-testid="aside"
        >
          <div className="p-[18px]">
            <AnimatePresence mode="wait" initial={false}>
              {focusedNode ? (
                <NodePanel
                  key={`node-${focusedNode.id}`}
                  node={focusedNode}
                  onBack={backToQuest}
                  onPractise={(loop, id) => openLoop(loop, id)}
                  onSetDiscipline={onSetDiscipline}
                />
              ) : (
                <QuestPanel key="quest" onAction={onQuestAction} />
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      <Toasts />
      <ReadLoop open={loopOpen("read")} nodeId={loopNode} key={`read-${modal.kind}`} />
      <WriteLoop
        open={loopOpen("write")}
        nodeId={loopNode}
        key={`write-${loopNode ?? ""}-${modal.kind}`}
      />
      <ExplainLoop
        open={loopOpen("explain")}
        nodeId={loopNode}
        key={`explain-${loopNode ?? ""}-${modal.kind}`}
      />
      <ReviewLoop open={loopOpen("review")} />
      <Celebration
        open={modal.kind === "celebration"}
        chapter={modal.kind === "celebration" ? modal.chapter : null}
        next={modal.kind === "celebration" ? modal.next : null}
        onContinue={onCelebrationContinue}
      />
      <Snapshot open={modal.kind === "snapshot"} onClose={closeModal} />
      <Modal open={modal.kind === "reset"} onClose={closeModal} label="Reset everything?">
        <ModalTitle sub="Progress, words, cards and streak will be wiped.">
          Reset everything?
        </ModalTitle>
        <ModalFoot>
          <button type="button" className="btn" onClick={closeModal}>
            Keep
          </button>
          <button
            type="button"
            className="btn primary"
            data-testid="reset-confirm"
            onClick={() => {
              reset();
              closeModal();
              focus(null);
              send({ type: "fit" });
            }}
          >
            Reset
          </button>
        </ModalFoot>
      </Modal>
      <Tutorial
        open={tutorialOpen && !tutorialDone}
        onDone={() => {
          setTutorialDone();
          setTutorialOpen(false);
        }}
      />
      <Onboarding open={!onboarded} onBegin={onBegin} />
    </div>
  );
}

function Hud() {
  const disc = useAppStore((s) => s.disc);
  const last = useAppStore((s) => s.streak.last);
  const warm = pathWarm(last);
  return (
    <>
      <span className="rounded-full border border-line bg-[rgba(20,27,39,.9)] px-[11px] py-[5px] text-[11px] text-muted">
        Discipline:{" "}
        <b className="text-ink" data-testid="hud-disc">
          {disc ? DISCIPLINES[disc].name : "—"}
        </b>
      </span>
      <span
        className="rounded-full border border-line bg-[rgba(20,27,39,.9)] px-[11px] py-[5px] text-[11px] text-muted"
        data-testid="hud-path"
        data-state={warm ? "lit" : "cold"}
      >
        Path: <b className={warm ? "text-orange" : "text-muted"}>{warm ? "lit" : "cold"}</b>
      </span>
    </>
  );
}
