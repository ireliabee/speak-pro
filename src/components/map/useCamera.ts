"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { NODE_BY_ID, VIEWBOX } from "@/data/graph";
import {
  CAMERA_SPRING,
  clamp,
  isSettled,
  prefersReducedMotion,
  stepSpring,
  type SpringConfig,
  type SpringState,
} from "@/lib/motion";

export interface Camera {
  /** world x at the centre of the viewport */
  x: number;
  /** world y at the centre of the viewport */
  y: number;
  /** zoom scale */
  k: number;
}

export const HOME_CAMERA: Camera = {
  x: VIEWBOX.x + VIEWBOX.w / 2,
  y: VIEWBOX.y + VIEWBOX.h / 2,
  k: 1,
};
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 5.3;
export const IDLE_AFTER_MS = 8000;
export const IDLE_PERIOD_MS = 6000;
export const IDLE_AMPLITUDE = 0.01;
export const DRAG_FRICTION = 0.92;
const FLY_ZOOM_OUT = 0.85;
const FLY_ARC_MS = 220;
const MAX_DT = 1 / 20;

export interface UseCameraOptions {
  /** Receives every frame; apply it to the DOM (never to React state). */
  apply: (cam: Camera) => void;
  spring?: SpringConfig;
  /** Disable idle drift (tests, reduced motion). */
  idle?: boolean;
}

export interface CameraApi {
  get: () => Camera;
  target: () => Camera;
  /** Fly-to: zoom out 15% → arc to target → settle. Resolves when settled. */
  flyTo: (to: Partial<Camera> | string, opts?: { width?: number }) => Promise<Camera>;
  /** Push-in toward a node when a modal opens (scale ×1.06). */
  pushIn: (id?: string | null) => Promise<Camera>;
  /** Pull back to where we were before the push-in. */
  pullBack: () => Promise<Camera>;
  fit: () => Promise<Camera>;
  zoomBy: (factor: number) => Promise<Camera>;
  /** Called by the pointer layer (d3-zoom) on every gesture frame. */
  nudge: (cam: Camera, velocity?: { x: number; y: number }) => void;
  /** Called by the pointer layer when a drag ends; applies inertia. */
  release: (velocity: { x: number; y: number }) => void;
  /** Any user input resets the idle clock. */
  markInput: () => void;
  isAnimating: () => boolean;
}

export function cameraForNode(id: string, width = 700): Camera | null {
  const n = NODE_BY_ID[id];
  if (!n) return null;
  return { x: n.x, y: n.y, k: VIEWBOX.w / width };
}

/**
 * One spring-driven camera for the whole map. All integration happens in rAF on refs;
 * React never re-renders because of it.
 */
export function useCamera({
  apply,
  spring = CAMERA_SPRING,
  idle = true,
}: UseCameraOptions): CameraApi {
  const cam = useRef<Camera>({ ...HOME_CAMERA });
  const target = useRef<Camera>({ ...HOME_CAMERA });
  const sx = useRef<SpringState>({ value: HOME_CAMERA.x, velocity: 0 });
  const sy = useRef<SpringState>({ value: HOME_CAMERA.y, velocity: 0 });
  const sk = useRef<SpringState>({ value: HOME_CAMERA.k, velocity: 0 });
  const raf = useRef<number | null>(null);
  const lastT = useRef<number | null>(null);
  const resolvers = useRef<Array<(c: Camera) => void>>([]);
  const lastInput = useRef<number>(typeof performance !== "undefined" ? performance.now() : 0);
  const idlePhase = useRef<number>(0);
  const beforePush = useRef<Camera | null>(null);
  const inertia = useRef<{ x: number; y: number } | null>(null);
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const emit = useCallback(() => applyRef.current(cam.current), []);

  const settle = useCallback(() => {
    const rs = resolvers.current;
    resolvers.current = [];
    for (const r of rs) r(cam.current);
  }, []);

  const stop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    lastT.current = null;
  }, []);

  const tick = useCallback(
    (now: number) => {
      const dt = lastT.current === null ? 1 / 60 : clamp((now - lastT.current) / 1000, 0, MAX_DT);
      lastT.current = now;

      if (inertia.current) {
        const v = inertia.current;
        v.x *= DRAG_FRICTION;
        v.y *= DRAG_FRICTION;
        target.current = {
          ...target.current,
          x: target.current.x + v.x * dt,
          y: target.current.y + v.y * dt,
        };
        if (Math.hypot(v.x, v.y) < 2) inertia.current = null;
      }

      const t = target.current;
      sx.current = stepSpring(sx.current, t.x, dt, spring);
      sy.current = stepSpring(sy.current, t.y, dt, spring);
      sk.current = stepSpring(sk.current, t.k, dt, spring);
      cam.current = { x: sx.current.value, y: sy.current.value, k: sk.current.value };
      emit();

      const done =
        isSettled(sx.current, t.x, 0.05) &&
        isSettled(sy.current, t.y, 0.05) &&
        isSettled(sk.current, t.k, 0.0005);
      if (done && !inertia.current) {
        cam.current = { ...t };
        sx.current = { value: t.x, velocity: 0 };
        sy.current = { value: t.y, velocity: 0 };
        sk.current = { value: t.k, velocity: 0 };
        emit();
        stop();
        settle();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    },
    [spring, emit, stop, settle],
  );

  const run = useCallback(() => {
    if (raf.current === null) {
      lastT.current = null;
      raf.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const goto = useCallback(
    (to: Camera): Promise<Camera> => {
      const t = { x: to.x, y: to.y, k: clamp(to.k, ZOOM_MIN, ZOOM_MAX) };
      target.current = t;
      if (reduced || typeof requestAnimationFrame !== "function") {
        stop();
        cam.current = { ...t };
        sx.current = { value: t.x, velocity: 0 };
        sy.current = { value: t.y, velocity: 0 };
        sk.current = { value: t.k, velocity: 0 };
        emit();
        settle();
        return Promise.resolve(cam.current);
      }
      return new Promise<Camera>((resolve) => {
        resolvers.current.push(resolve);
        run();
      });
    },
    [reduced, stop, emit, settle, run],
  );

  const resolveTarget = useCallback((to: Partial<Camera> | string, width?: number): Camera => {
    if (typeof to === "string") return cameraForNode(to, width) ?? { ...target.current };
    return { ...target.current, ...to };
  }, []);

  const flyTo = useCallback<CameraApi["flyTo"]>(
    (to, opts) => {
      const dest = resolveTarget(to, opts?.width);
      lastInput.current = performance.now();
      if (reduced) return goto(dest);
      // Always the same shape: zoom out 15% toward the midpoint, then arc in and settle.
      const from = cam.current;
      const mid: Camera = {
        x: (from.x + dest.x) / 2,
        y: (from.y + dest.y) / 2,
        k: Math.min(from.k, dest.k) * FLY_ZOOM_OUT,
      };
      target.current = mid;
      run();
      return new Promise<Camera>((resolve) => {
        setTimeout(() => {
          void goto(dest).then(resolve);
        }, FLY_ARC_MS);
      });
    },
    [resolveTarget, reduced, goto, run],
  );

  const pushIn = useCallback<CameraApi["pushIn"]>(
    (id) => {
      beforePush.current = { ...target.current };
      const n = id ? NODE_BY_ID[id] : undefined;
      const t = target.current;
      const dest: Camera = n
        ? { x: t.x + (n.x - t.x) * 0.25, y: t.y + (n.y - t.y) * 0.25, k: t.k * 1.06 }
        : { ...t, k: t.k * 1.06 };
      return goto(dest);
    },
    [goto],
  );

  const pullBack = useCallback<CameraApi["pullBack"]>(() => {
    const back = beforePush.current ?? target.current;
    beforePush.current = null;
    return goto(back);
  }, [goto]);

  const fit = useCallback(() => flyTo(HOME_CAMERA), [flyTo]);

  const zoomBy = useCallback<CameraApi["zoomBy"]>(
    (factor) => {
      lastInput.current = performance.now();
      return goto({ ...target.current, k: target.current.k / factor });
    },
    [goto],
  );

  const nudge = useCallback<CameraApi["nudge"]>(
    (c) => {
      lastInput.current = performance.now();
      inertia.current = null;
      resolvers.current = [];
      stop();
      cam.current = { ...c };
      target.current = { ...c };
      sx.current = { value: c.x, velocity: 0 };
      sy.current = { value: c.y, velocity: 0 };
      sk.current = { value: c.k, velocity: 0 };
      emit();
    },
    [stop, emit],
  );

  const release = useCallback<CameraApi["release"]>(
    (v) => {
      if (reduced || Math.hypot(v.x, v.y) < 20) return;
      inertia.current = { ...v };
      run();
    },
    [reduced, run],
  );

  const markInput = useCallback(() => {
    lastInput.current = performance.now();
  }, []);

  // Idle drift: after 8 s of no input, breathe ±1 % scale over 6 s.
  useEffect(() => {
    if (!idle || reduced || typeof requestAnimationFrame !== "function") return;
    let id: number;
    const base = { k: 0 };
    const loop = (now: number) => {
      id = requestAnimationFrame(loop);
      if (raf.current !== null || now - lastInput.current < IDLE_AFTER_MS) {
        idlePhase.current = now;
        base.k = target.current.k;
        return;
      }
      const phase = ((now - idlePhase.current) / IDLE_PERIOD_MS) * Math.PI * 2;
      const k = base.k * (1 + Math.sin(phase) * IDLE_AMPLITUDE);
      cam.current = { ...target.current, k };
      sk.current = { value: k, velocity: 0 };
      emit();
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [idle, reduced, emit]);

  useEffect(() => () => stop(), [stop]);

  return useMemo<CameraApi>(
    () => ({
      get: () => cam.current,
      target: () => target.current,
      flyTo,
      pushIn,
      pullBack,
      fit,
      zoomBy,
      nudge,
      release,
      markInput,
      isAnimating: () => raf.current !== null,
    }),
    [flyTo, pushIn, pullBack, fit, zoomBy, nudge, release, markInput],
  );
}
