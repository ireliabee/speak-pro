/** Motion utilities shared by the map, loops and reward sequence. Pure where possible. */

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

/** The signature camera spring from DESIGN.md §2. */
export const CAMERA_SPRING: SpringConfig = { stiffness: 120, damping: 20, mass: 1 };

export interface SpringState {
  value: number;
  velocity: number;
}

/** One semi-implicit Euler step of a damped spring toward `target` over `dt` seconds. */
export function stepSpring(
  s: SpringState,
  target: number,
  dt: number,
  cfg: SpringConfig = CAMERA_SPRING,
): SpringState {
  const mass = cfg.mass ?? 1;
  const force = -cfg.stiffness * (s.value - target) - cfg.damping * s.velocity;
  const velocity = s.velocity + (force / mass) * dt;
  const value = s.value + velocity * dt;
  return { value, velocity };
}

export function isSettled(s: SpringState, target: number, eps = 1e-3): boolean {
  return Math.abs(s.value - target) < eps && Math.abs(s.velocity) < eps;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Honour the OS "reduce motion" setting. Safe to call on the server. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Haptic tick on devices that support it. */
export function haptic(ms = 12): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Tween a number and hand each frame to `onFrame`. Returns a cancel function.
 * Uses rAF so it never touches React state.
 */
export function tweenNumber(
  from: number,
  to: number,
  duration: number,
  onFrame: (v: number) => void,
  ease: (t: number) => number = easeOutCubic,
): () => void {
  if (duration <= 0 || prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
    onFrame(to);
    return () => undefined;
  }
  let raf = 0;
  const t0 = performance.now();
  const step = (now: number) => {
    const t = clamp((now - t0) / duration, 0, 1);
    onFrame(lerp(from, to, ease(t)));
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Tiny seeded PRNG (mulberry32) for deterministic starfields. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
