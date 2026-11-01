import type { LoopId } from "@/data/graph";

/**
 * Four fixed tones, one per loop — the muscle-memory hook (DESIGN.md §3).
 * READ C5 · WRITE E5 · SPEAK G5 · REVIEW C6. Never change them.
 */
export const TONES: Readonly<Record<LoopId, number>> = {
  read: 523.25,
  write: 659.25,
  explain: 783.99,
  review: 1046.5,
};

type Ctx = AudioContext;
let ctx: Ctx | null = null;

function getCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

/** Play a short sine tone. `at` offsets the start in seconds (for chords/arpeggios). */
export function playTone(freq: number, { at = 0, duration = 0.28, gain = 0.08 } = {}): boolean {
  const c = getCtx();
  if (!c) return false;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
  return true;
}

export function playLoopTone(loop: LoopId): boolean {
  return playTone(TONES[loop]);
}

/** All four tones together — the "day complete" chord. */
export function playChord(): boolean {
  const ids = Object.keys(TONES) as LoopId[];
  return ids
    .map((id, i) => playTone(TONES[id], { at: i * 0.04, duration: 0.9, gain: 0.05 }))
    .every(Boolean);
}

/** For tests. */
export function _resetAudio(): void {
  ctx = null;
}
