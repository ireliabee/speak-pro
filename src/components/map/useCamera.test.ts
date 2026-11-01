import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { cameraForNode, HOME_CAMERA, useCamera, type Camera } from "./useCamera";
import { NODE_BY_ID, VIEWBOX } from "@/data/graph";

/** Drive rAF deterministically at 60 fps. */
function installRaf() {
  let now = 0;
  const queue = new Map<number, FrameRequestCallback>();
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.set(++id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (h: number) => queue.delete(h));
  vi.spyOn(performance, "now").mockImplementation(() => now);
  return {
    frames(n: number) {
      for (let i = 0; i < n; i++) {
        now += 1000 / 60;
        const cbs = [...queue.entries()];
        queue.clear();
        for (const [, cb] of cbs) cb(now);
      }
    },
  };
}

describe("useCamera", () => {
  let raf: ReturnType<typeof installRaf>;
  beforeEach(() => {
    vi.useFakeTimers();
    raf = installRaf();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts at home and reports node targets", () => {
    const apply = vi.fn();
    const { result } = renderHook(() => useCamera({ apply, idle: false }));
    expect(result.current.get()).toEqual(HOME_CAMERA);
    expect(cameraForNode("mir", 800)).toEqual({ x: NODE_BY_ID.mir!.x, y: NODE_BY_ID.mir!.y, k: 2 });
    expect(cameraForNode("nope")).toBeNull();
  });

  it("fly-to zooms out, arcs to the target and resolves there", async () => {
    const frames: Camera[] = [];
    const apply = vi.fn((c: Camera) => frames.push({ ...c }));
    const { result } = renderHook(() => useCamera({ apply, idle: false }));

    let settled: Camera | null = null;
    act(() => {
      void result.current.flyTo("mir", { width: 700 }).then((c) => (settled = c));
    });
    // Phase 1: zoom-out toward the midpoint for 220 ms.
    act(() => raf.frames(10));
    const during = result.current.get();
    expect(during.k).toBeLessThan(HOME_CAMERA.k);
    expect(result.current.isAnimating()).toBe(true);
    // Phase 2: the arc to the destination.
    act(() => vi.advanceTimersByTime(230));
    expect(result.current.target()).toEqual(cameraForNode("mir", 700));
    act(() => raf.frames(400));
    await act(async () => {
      await Promise.resolve();
    });
    expect(settled).toEqual(cameraForNode("mir", 700));
    expect(result.current.get()).toEqual(cameraForNode("mir", 700));
    expect(result.current.isAnimating()).toBe(false);
    expect(apply).toHaveBeenCalled();
    // Overshoot is bounded: the spring never zoomed past the destination by more than 10%.
    const maxK = Math.max(...frames.map((f) => f.k));
    expect(maxK).toBeLessThan((VIEWBOX.w / 700) * 1.1);
  });

  it("push-in scales by 1.06 toward the node and pull-back restores the previous target", async () => {
    const { result } = renderHook(() => useCamera({ apply: vi.fn(), idle: false }));
    act(() => {
      void result.current.pushIn("mir");
    });
    const t = result.current.target();
    expect(t.k).toBeCloseTo(HOME_CAMERA.k * 1.06, 5);
    expect(t.x).toBeGreaterThan(HOME_CAMERA.x); // mir is to the right of home
    act(() => raf.frames(400));
    act(() => {
      void result.current.pullBack();
    });
    expect(result.current.target()).toEqual(HOME_CAMERA);
  });

  it("nudge snaps instantly (user gesture) and zoomBy clamps to the zoom range", () => {
    const apply = vi.fn();
    const { result } = renderHook(() => useCamera({ apply, idle: false }));
    act(() => result.current.nudge({ x: 100, y: 200, k: 2 }));
    expect(result.current.get()).toEqual({ x: 100, y: 200, k: 2 });
    expect(apply).toHaveBeenLastCalledWith({ x: 100, y: 200, k: 2 });
    act(() => {
      void result.current.zoomBy(0.01);
    });
    expect(result.current.target().k).toBeLessThanOrEqual(5.3);
  });

  it("release applies drag inertia that decays with friction", () => {
    const { result } = renderHook(() => useCamera({ apply: vi.fn(), idle: false }));
    act(() => result.current.nudge({ ...HOME_CAMERA }));
    act(() => result.current.release({ x: 600, y: 0 }));
    act(() => raf.frames(5));
    const early = result.current.target().x;
    expect(early).toBeGreaterThan(HOME_CAMERA.x);
    act(() => raf.frames(300));
    const late = result.current.target().x;
    expect(late).toBeGreaterThan(early);
    expect(late - early).toBeLessThan(600); // friction 0.92 per frame bounds the travel
    expect(result.current.isAnimating()).toBe(false);
  });
});
