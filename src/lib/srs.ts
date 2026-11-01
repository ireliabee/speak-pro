import type { Card } from "@/store/state";

/** Days until next review, indexed by Leitner box (box 0 unused). */
export const INTERVALS: readonly number[] = [0, 1, 3, 7, 14, 30];
export const MAX_BOX = 5;
export const DAY_MS = 864e5;

/** 0 = Again, 1 = Hard, 2 = Good, 3 = Easy */
export type Rating = 0 | 1 | 2 | 3;

export function nextBox(box: number, rating: Rating): number {
  if (rating === 0) return 1;
  return Math.min(MAX_BOX, box + (rating === 3 ? 2 : 1));
}

export function intervalFor(box: number): number {
  return INTERVALS[Math.max(0, Math.min(MAX_BOX, box))] ?? 0;
}

/** Returns an updated copy of the card after a rating at time `now`. */
export function rateCard(card: Card, rating: Rating, now: number = Date.now()): Card {
  const box = nextBox(card.box, rating);
  return { ...card, box, next: now + intervalFor(box) * DAY_MS };
}

export function dueCards(cards: readonly Card[], now: number = Date.now()): Card[] {
  return cards.filter((c) => c.next <= now);
}

/**
 * Builds the deck for a review session: all due cards, or — if nothing is due —
 * the five cards due soonest so the user can always practise.
 */
export function buildDeck(cards: readonly Card[], now: number = Date.now(), fallback = 5): Card[] {
  const due = dueCards(cards, now);
  if (due.length) return due;
  return [...cards].sort((a, b) => a.next - b.next).slice(0, fallback);
}

export function newCard(w: string, s: string, now: number = Date.now()): Card {
  return { w, s, box: 1, next: now };
}
