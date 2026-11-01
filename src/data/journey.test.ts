import { describe, expect, it } from "vitest";
import { JOURNEY, CHAPTER_BY_ID } from "./journey";
import { NODE_BY_ID } from "./graph";
import { defaults, type AppState } from "@/store/state";

const mk = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ w: `w${i}`, s: "", src: "", at: 0 }));

/** A state in which every objective except the final chapter's is met. */
const complete: AppState = {
  ...defaults(),
  disc: "averi",
  words: mk(50),
  reviewed: 50,
  counts: { read: 9, write: 9, explain: 5, review: 9 },
  best: {
    jatavia: 60,
    mir: 60,
    jiovanna: 60,
    monireoluwa: 60,
    kayceon: 60,
    sheyenne: 60,
    breann: 60,
  },
  flags: { metRoot: true, feynman3: true, orwell: true },
};

describe("JOURNEY", () => {
  it("has 19 chapters with unique ids pointing at real nodes", () => {
    expect(JOURNEY).toHaveLength(19);
    const ids = new Set(JOURNEY.map((c) => c.id));
    expect(ids.size).toBe(19);
    for (const c of JOURNEY) {
      expect(NODE_BY_ID[c.node], c.id).toBeDefined();
      expect(c.xp).toBeGreaterThan(0);
      expect(CHAPTER_BY_ID[c.id]).toBe(c);
    }
  });

  it("every check fails on a fresh state", () => {
    const s = defaults();
    for (const c of JOURNEY) expect(c.check(s), c.id).toBe(false);
  });

  it("every check except the last passes on a complete state", () => {
    for (const c of JOURNEY.slice(0, -1)) expect(c.check(complete), c.id).toBe(true);
    expect(JOURNEY.at(-1)!.check(complete)).toBe(false);
  });

  it("score chapters need 60 on their own framework", () => {
    const s = { ...complete, best: { ...complete.best, scqa: 0, jiovanna: 59 } };
    expect(CHAPTER_BY_ID.scqa!.check(s)).toBe(false);
    expect(CHAPTER_BY_ID.prep!.check(s)).toBe(true);
  });
});
