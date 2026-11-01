import { describe, expect, it } from "vitest";
import { scoreText, SUBMIT_THRESHOLD } from "./scoring";

const GOOD_PREP = `Reading outside your field is the fastest way to grow a precise vocabulary. This works because every discipline names ideas that your own field only gestures at. For example, a doctor who reads a court opinion meets the word estoppel and suddenly has a tool for a whole class of arguments. Last week I logged five such words from a single editorial and used three of them in a memo. The habit costs thirty minutes a day and nothing else. That is why reading outside your field is the fastest way to grow a precise vocabulary.`;

describe("scoreText", () => {
  it("passes only the trivial Orwell check for empty text", () => {
    const r = scoreText("", "jatavia");
    expect(r.checks).toHaveLength(6);
    expect(r.checks.filter((c) => c.ok).map((c) => c.txt)).toEqual([
      "Orwell check: few very long words (0)",
    ]);
    expect(r.score).toBe(17);
    expect(r.longw).toBe(0);
  });

  it("scores a well-formed PREP paragraph at 100", () => {
    const r = scoreText(GOOD_PREP, "jatavia");
    expect(r.score).toBe(100);
    expect(r.checks.every((c) => c.ok)).toBe(true);
  });

  it("adds a complication check for SCQA", () => {
    const r = scoreText(GOOD_PREP, "jiovanna");
    expect(r.checks).toHaveLength(7);
    expect(r.checks.at(-1)?.txt).toMatch(/complication/);
    expect(r.checks.at(-1)?.ok).toBe(true); // "suddenly"
    expect(scoreText("No tension here.", "jiovanna").checks.at(-1)?.ok).toBe(false);
    expect(r.checks[4]?.txt).toMatch(/resolves the opening/);
  });

  it("adds story-spine and NVC checks for their frameworks", () => {
    expect(scoreText("once upon a time", "kayceon").checks.at(-1)?.ok).toBe(true);
    expect(scoreText("I feel tired and I need rest.", "breann").checks.at(-1)?.ok).toBe(true);
    expect(scoreText("plain text", "breann").checks.at(-1)?.ok).toBe(false);
  });

  it("counts very long words for the Orwell check", () => {
    const text = `${"antidisestablishment ".repeat(10)}done.`;
    const r = scoreText(text, "mir");
    expect(r.longw).toBe(10);
    expect(r.checks[5]?.ok).toBe(false);
  });

  it("scores a short paragraph below the submit threshold", () => {
    const r = scoreText("Short. Very short. Too short. Yes.", "mir");
    expect(r.score).toBeLessThan(SUBMIT_THRESHOLD + 20);
    expect(r.checks[0]?.ok).toBe(true);
    expect(r.checks[1]?.ok).toBe(false);
  });
});
