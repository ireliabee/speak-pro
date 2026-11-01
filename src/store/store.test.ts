import { beforeEach, describe, expect, it } from "vitest";
import { LOOPS } from "@/data/loops";
import { LOOP_XP, PERSIST_KEY, useAppStore } from "./useAppStore";

const get = () => useAppStore.getState();

beforeEach(() => {
  localStorage.clear();
  get().reset();
});

describe("useAppStore", () => {
  it("completeLoop increments counts, reps and xp, and touches the streak", () => {
    const r = get().completeLoop("read", "ovi");
    const s = get();
    expect(s.counts.read).toBe(1);
    expect(s.xp).toBe(LOOP_XP);
    for (const id of LOOPS.read.nodes) expect(s.progress[id]).toBe(1);
    expect(r.grown).toEqual(expect.arrayContaining([...LOOPS.read.nodes]));
    expect(s.streak.current).toBe(1);
    expect(s.logs).toHaveLength(1);
    expect(r.chapter).toBeNull();
  });

  it("completes a chapter when its check passes", () => {
    get().markRootMet();
    expect(get().checkChapters()?.id).toBe("meet");
    expect(get().chapters.meet).toBeTruthy();
    expect(get().xp).toBe(20);
    // idempotent: a second call does not re-complete
    expect(get().checkChapters()).toBeNull();
  });

  it("setDiscipline seeds glossary words once and completes the disc chapter", () => {
    get().markRootMet();
    get().checkChapters();
    expect(get().setDiscipline("averi")).toBe(3);
    expect(get().setDiscipline("averi")).toBe(0);
    expect(get().words).toHaveLength(3);
    expect(get().cards).toHaveLength(3);
    expect(get().checkChapters()?.id).toBe("disc");
  });

  it("addWords + completeLoop completes the read chapter at 5 words", () => {
    get().markRootMet();
    get().checkChapters();
    get().setDiscipline("berlin");
    get().checkChapters();
    const n = get().addWords(
      [
        { w: "one", s: "" },
        { w: " two ", s: "s" },
        { w: "", s: "ignored" },
      ],
      "src",
    );
    expect(n).toBe(2);
    expect(get().words).toHaveLength(5);
    const r = get().completeLoop("read");
    expect(r.chapter?.id).toBe("read1");
    expect(get().xp).toBe(20 + 30 + LOOP_XP + 60);
  });

  it("rateCard applies the Leitner schedule and counts reviews", () => {
    get().addWords([{ w: "tort", s: "x" }], "");
    get().rateCard("tort", 3, 0);
    expect(get().cards[0]?.box).toBe(3);
    expect(get().reviewed).toBe(1);
  });

  it("submitWrite records best score, orwell flag and bonus rep", () => {
    const r = get().submitWrite("jatavia", 90, 0);
    expect(get().best.jatavia).toBe(90);
    expect(get().flags.orwell).toBe(true);
    expect(get().progress.jatavia).toBe(2); // bonus rep + loop rep
    expect(r.grown).toContain("jatavia");
    get().submitWrite("jatavia", 50, 2);
    expect(get().best.jatavia).toBe(90);
  });

  it("submitExplain sets feynman3 only on 3/3 checks", () => {
    get().submitExplain("mir", 2);
    expect(get().flags.feynman3).toBeUndefined();
    get().submitExplain("mir", 3);
    expect(get().flags.feynman3).toBe(true);
    expect(get().counts.explain).toBe(2);
  });

  it("reports when all four loops are done today", () => {
    get().completeLoop("read");
    get().completeLoop("write");
    get().completeLoop("explain");
    const r = get().completeLoop("review");
    expect(r.allFourToday).toBe(true);
  });

  it("persists to localStorage under the versioned key", () => {
    get().onboard("Elijah");
    const raw = localStorage.getItem(PERSIST_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { state: { name: string; onboard?: unknown } };
    expect(parsed.state.name).toBe("Elijah");
    expect(parsed.state.onboard).toBeUndefined();
  });

  it("reset restores defaults", () => {
    get().completeLoop("read");
    get().reset();
    expect(get().xp).toBe(0);
    expect(get().counts.read).toBe(0);
  });
});
