import { describe, expect, it } from "vitest";
import { JOURNEY } from "@/data/journey";
import { NODE_BY_ID, NODES } from "@/data/graph";
import { DISCIPLINE_IDS } from "@/data/disciplines";
import { defaults } from "@/store/state";
import { chapterIndex, levelOf, masteryPct, questProgress, revealed, stateOf } from "./journey";

describe("levelOf", () => {
  it("maps xp to levels with the next threshold", () => {
    expect(levelOf(0)).toEqual({ name: "Novice", from: 0, next: { xp: 150, name: "Apprentice" } });
    expect(levelOf(149).name).toBe("Novice");
    expect(levelOf(150).name).toBe("Apprentice");
    expect(levelOf(800).name).toBe("Rhetor");
    expect(levelOf(5000)).toEqual({ name: "Elite", from: 1900, next: null });
  });
});

describe("chapterIndex", () => {
  it("is 0 on a fresh state", () => {
    expect(chapterIndex(defaults())).toBe(0);
  });
  it("is the first unfinished chapter", () => {
    expect(chapterIndex({ chapters: { meet: 1, disc: 1 } })).toBe(2);
  });
  it("clamps to the last chapter when all are done", () => {
    const chapters = Object.fromEntries(JOURNEY.map((c) => [c.id, 1]));
    expect(chapterIndex({ chapters })).toBe(JOURNEY.length - 1);
  });
});

describe("revealed", () => {
  it("shows only the root and the first chapter node at the start", () => {
    const set = revealed({ chapters: {}, disc: null });
    expect(set).toEqual(new Set(["azair"]));
  });
  it("reveals the hub siblings of completed chapters and the discipline packs", () => {
    const set = revealed({ chapters: { meet: 1, disc: 1 }, disc: "averi" });
    expect(set.has("ovi")).toBe(true);
    expect(set.has("hubBig")).toBe(true);
    for (const d of DISCIPLINE_IDS) expect(set.has(d)).toBe(true);
    // siblings of azair in hubL are revealed once "meet" is done
    expect(set.has("constance")).toBe(true);
    expect(set.has("mir")).toBe(false);
  });
  it("reveals everything once the journey is complete", () => {
    const chapters = Object.fromEntries(JOURNEY.slice(0, -1).map((c) => [c.id, 1]));
    const set = revealed({ chapters, disc: null });
    for (const n of NODES) expect(set.has(n.id)).toBe(true);
  });
});

describe("stateOf / masteryPct", () => {
  it("derives node state from reps", () => {
    const n = NODE_BY_ID.mir!;
    expect(stateOf({ progress: {}, discovered: {} }, n)).toBe("locked");
    expect(stateOf({ progress: {}, discovered: { mir: true } }, n)).toBe("discovered");
    expect(stateOf({ progress: { mir: 3 }, discovered: {} }, n)).toBe("practising");
    expect(stateOf({ progress: { mir: 10 }, discovered: {} }, n)).toBe("mastered");
    expect(stateOf({ progress: {}, discovered: {} }, NODE_BY_ID.hubC!)).toBe("");
  });
  it("derives root state from map mastery", () => {
    const root = NODE_BY_ID.azair!;
    expect(stateOf({ progress: {}, discovered: {} }, root)).toBe("locked");
    expect(masteryPct({ progress: { mir: 10 } })).toBeGreaterThan(0);
    expect(stateOf({ progress: { mir: 10 }, discovered: {} }, root)).toBe("discovered");
  });
});

describe("questProgress", () => {
  it("reports progress for counted chapters and best scores", () => {
    const s = { ...defaults(), words: [{ w: "a", s: "", src: "", at: 0 }] };
    expect(questProgress(s, JOURNEY[2]!)).toEqual({ pct: 20, txt: "1/5 words" });
    expect(questProgress(s, JOURNEY[4]!)).toBeNull();
    expect(questProgress({ ...s, best: { jatavia: 30 } }, JOURNEY[4]!)).toEqual({
      pct: 50,
      txt: "best score 30 (need 60)",
    });
  });
});
