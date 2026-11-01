import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CAMERA_SPRING,
  clamp,
  easeOutBack,
  haptic,
  isSettled,
  prefersReducedMotion,
  seeded,
  stepSpring,
  tweenNumber,
} from "./motion";

afterEach(() => vi.restoreAllMocks());

describe("spring", () => {
  it("settles on the target with the camera spring", () => {
    let s = { value: 0, velocity: 0 };
    for (let i = 0; i < 600; i++) s = stepSpring(s, 100, 1 / 60, CAMERA_SPRING);
    expect(isSettled(s, 100)).toBe(true);
  });
  it("is near-critically damped (ζ≈0.91): fast approach, no visible overshoot", () => {
    let s = { value: 0, velocity: 0 };
    let max = 0;
    let reached = Infinity;
    for (let i = 0; i < 300; i++) {
      s = stepSpring(s, 100, 1 / 60);
      max = Math.max(max, s.value);
      if (s.value > 95 && reached === Infinity) reached = i;
    }
    expect(max).toBeLessThan(100.5);
    expect(reached).toBeLessThan(60); // within ~1 s at 60 fps
  });
});

describe("helpers", () => {
  it("clamp / easeOutBack / seeded", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(easeOutBack(1)).toBeCloseTo(1);
    expect(easeOutBack(0.7)).toBeGreaterThan(1);
    const a = seeded(42);
    const b = seeded(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("reads prefers-reduced-motion and vibrates safely", () => {
    const mm = vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    expect(prefersReducedMotion()).toBe(true);
    mm.mockReturnValue({ matches: false } as MediaQueryList);
    expect(prefersReducedMotion()).toBe(false);
    const vib = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vib, configurable: true });
    haptic(12);
    expect(vib).toHaveBeenCalledWith(12);
  });
  it("tweenNumber jumps to the end under reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const frames: number[] = [];
    tweenNumber(0, 10, 300, (v) => frames.push(v));
    expect(frames).toEqual([10]);
  });
});
