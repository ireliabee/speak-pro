import { describe, expect, it } from "vitest";
import {
  buildDeck,
  DAY_MS,
  dueCards,
  INTERVALS,
  intervalFor,
  newCard,
  nextBox,
  rateCard,
} from "./srs";

describe("Leitner schedule", () => {
  it("has the five Leitner intervals", () => {
    expect(INTERVALS).toEqual([0, 1, 3, 7, 14, 30]);
    expect(intervalFor(5)).toBe(30);
    expect(intervalFor(99)).toBe(30);
    expect(intervalFor(-1)).toBe(0);
  });

  it("promotes on Good/Hard, double-promotes on Easy, resets on Again", () => {
    expect(nextBox(1, 2)).toBe(2);
    expect(nextBox(1, 1)).toBe(2);
    expect(nextBox(1, 3)).toBe(3);
    expect(nextBox(4, 0)).toBe(1);
    expect(nextBox(5, 3)).toBe(5);
  });

  it("schedules the next review by box interval", () => {
    const now = 1_000_000;
    const card = newCard("tort", "A tort is a civil wrong.", now);
    expect(card.box).toBe(1);
    expect(card.next).toBe(now);
    const good = rateCard(card, 2, now);
    expect(good.box).toBe(2);
    expect(good.next).toBe(now + 3 * DAY_MS);
    const again = rateCard(good, 0, now);
    expect(again.box).toBe(1);
    expect(again.next).toBe(now + 1 * DAY_MS);
    // immutability
    expect(card.box).toBe(1);
  });

  it("builds a deck from due cards, falling back to the soonest five", () => {
    const now = 10 * DAY_MS;
    const cards = Array.from({ length: 8 }, (_, i) => ({
      w: `w${i}`,
      s: "",
      box: 1,
      next: now + (i + 1) * DAY_MS,
    }));
    expect(dueCards(cards, now)).toHaveLength(0);
    const deck = buildDeck(cards, now);
    expect(deck.map((c) => c.w)).toEqual(["w0", "w1", "w2", "w3", "w4"]);
    const due = [{ w: "due", s: "", box: 2, next: now - 1 }, ...cards];
    expect(buildDeck(due, now).map((c) => c.w)).toEqual(["due"]);
  });
});
