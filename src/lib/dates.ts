export const DAY_MS = 864e5;

export const todayISO = (now: Date = new Date()): string => now.toISOString().slice(0, 10);

export const dayDiff = (a: string, b: string): number =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS);

/** The path is "warm" when the last step was today or yesterday. */
export function pathWarm(last: string | null, today: string = todayISO()): boolean {
  if (!last) return false;
  return dayDiff(last, today) <= 1;
}
