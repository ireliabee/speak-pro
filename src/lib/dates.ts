export const DAY_MS = 864e5;

export const todayISO = (now: Date = new Date()): string => now.toISOString().slice(0, 10);

export const dayDiff = (a: string, b: string): number =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS);

/** The path is "warm" when the last step was today or yesterday. */
export function pathWarm(last: string | null, today: string = todayISO()): boolean {
  if (!last) return false;
  return dayDiff(last, today) <= 1;
}

export type PathState = "lit" | "at-risk" | "cold";
export const AT_RISK_AFTER_MS = 20 * 3600 * 1000;

/**
 * lit: streak alive and last action < 20 h ago · at-risk: streak alive but > 20 h ·
 * cold: no step today or yesterday.
 */
export function pathState(
  last: string | null,
  lastActionAt: number | null,
  now: number = Date.now(),
): PathState {
  if (!pathWarm(last, todayISO(new Date(now)))) return "cold";
  if (lastActionAt !== null && now - lastActionAt > AT_RISK_AFTER_MS) return "at-risk";
  return "lit";
}
