"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import {
  COLORS,
  EDGES,
  NODES,
  NODE_BY_ID,
  VIEWBOX,
  neighbours,
  type GraphEdge,
  type GraphNode,
} from "@/data/graph";
import { JOURNEY } from "@/data/journey";
import { chapterIndex, reps, revealed, stateOf } from "@/lib/journey";
import { pathState } from "@/lib/dates";
import { haptic, prefersReducedMotion, seeded } from "@/lib/motion";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore, type MapCommand } from "@/store/useUiStore";
import { childPositions, edgePath, labelPlacement, rootLoopPath } from "./geometry";
import { useCamera, ZOOM_MAX, ZOOM_MIN, type Camera } from "./useCamera";

export interface SkillMapProps {
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick: () => void;
}

const ROOT = NODE_BY_ID.azair!;
const NS = "http://www.w3.org/2000/svg";
const STAR_PARALLAX = 0.2;
const LANTERN_R = 260;
const LANTERN_LERP = 0.06;

/** Reward sequence timings (ms) — identical every time (DESIGN.md §3). */
export const REWARD = {
  dim: 200,
  wipe: 350,
  flash: 120,
  arc: 450,
  particles: 900,
  total: 1300,
} as const;

function cameraToTransform(c: Camera): ZoomTransform {
  const cx = VIEWBOX.x + VIEWBOX.w / 2;
  const cy = VIEWBOX.y + VIEWBOX.h / 2;
  return zoomIdentity.translate(cx - c.k * c.x, cy - c.k * c.y).scale(c.k);
}

function transformToCamera(t: ZoomTransform): Camera {
  const cx = VIEWBOX.x + VIEWBOX.w / 2;
  const cy = VIEWBOX.y + VIEWBOX.h / 2;
  return { x: (cx - t.x) / t.k, y: (cy - t.y) / t.k, k: t.k };
}

/** Deterministic starfield so SSR and client agree. */
const STARS = (() => {
  const rnd = seeded(7);
  return Array.from({ length: 160 }, () => ({
    x: VIEWBOX.x - 400 + rnd() * (VIEWBOX.w + 800),
    y: VIEWBOX.y - 300 + rnd() * (VIEWBOX.h + 600),
    r: 0.6 + rnd() * 1.4,
    o: 0.15 + rnd() * 0.5,
  }));
})();

export default function SkillMap({ onNodeClick, onBackgroundClick }: SkillMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<SVGGElement>(null);
  const starsRef = useRef<SVGGElement>(null);
  const lanternRef = useRef<SVGCircleElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  const edgesRef = useRef<SVGGElement>(null);
  const nodesRef = useRef<SVGGElement>(null);
  const zoomBehaviour = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gesture = useRef<{ cam: Camera; t: number; v: { x: number; y: number } } | null>(null);
  const lantern = useRef<{ x: number; y: number; raf: number | null }>({
    x: ROOT.x,
    y: ROOT.y,
    raf: null,
  });

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [entering, setEntering] = useState(true);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const progress = useAppStore((s) => s.progress);
  const discovered = useAppStore((s) => s.discovered);
  const chapters = useAppStore((s) => s.chapters);
  const disc = useAppStore((s) => s.disc);
  const expanded = useAppStore((s) => s.expanded);
  const mode = useAppStore((s) => s.mode);
  const streakLast = useAppStore((s) => s.streak.last);
  const lastActionAt = useAppStore((s) => s.lastActionAt);
  const focusedId = useUiStore((s) => s.focusedId);
  const commands = useUiStore((s) => s.commands);
  const consume = useUiStore((s) => s.consume);

  const path = pathState(streakLast, lastActionAt);
  const lit = path === "lit";
  const warm = path !== "cold";
  const visible = useMemo(() => revealed({ chapters, disc }), [chapters, disc]);
  const targetId = JOURNEY[chapterIndex({ chapters })]!.node;
  const metRoot = !!chapters.meet;
  const highlightId = focusedId ?? hoverId;
  const highlightSet = useMemo(() => (highlightId ? neighbours(highlightId) : null), [highlightId]);

  const isFogged = useCallback(
    (n: GraphNode): boolean => {
      if (n.type === "n") return !visible.has(n.id);
      if (n.type === "c") return !(visible.has(n.id) || (!!n.disc && metRoot));
      return false;
    },
    [visible, metRoot],
  );

  /* ---------- camera ---------- */
  const applyCamera = useCallback((c: Camera) => {
    const t = cameraToTransform(c);
    zoomRef.current?.setAttribute("transform", t.toString());
    // Parallax: the starfield moves at 0.2× the graph.
    starsRef.current?.setAttribute(
      "transform",
      `translate(${t.x * STAR_PARALLAX},${t.y * STAR_PARALLAX}) scale(${1 + (t.k - 1) * STAR_PARALLAX})`,
    );
    const svg = svgRef.current;
    const z = zoomBehaviour.current;
    if (svg && z) z.transform(select(svg), t); // keep d3's internal state in sync (no sourceEvent)
  }, []);

  const camera = useCamera({ apply: applyCamera, idle: !reduced });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .filter((ev: Event) => {
        if (ev.type === "mousedown" || ev.type === "touchstart") {
          const target = ev.target as Element | null;
          if (target?.closest?.(".node")) return false;
          if (!(ev as MouseEvent).view) return false;
        }
        return !(ev as MouseEvent).ctrlKey || ev.type === "wheel";
      })
      .on("start", (ev) => {
        if (!ev.sourceEvent) return;
        gesture.current = { cam: camera.get(), t: performance.now(), v: { x: 0, y: 0 } };
      })
      .on("zoom", (ev) => {
        if (!ev.sourceEvent) return; // programmatic: already applied
        const c = transformToCamera(ev.transform as ZoomTransform);
        const g = gesture.current;
        const now = performance.now();
        if (g) {
          const dt = Math.max(1, now - g.t) / 1000;
          g.v = { x: (c.x - g.cam.x) / dt, y: (c.y - g.cam.y) / dt };
          g.cam = c;
          g.t = now;
        }
        camera.nudge(c);
      })
      .on("end", (ev) => {
        if (!ev.sourceEvent) return;
        const g = gesture.current;
        gesture.current = null;
        if (g && ev.sourceEvent.type !== "wheel") camera.release(g.v);
      });
    zoomBehaviour.current = z;
    select(svg).call(z).on("dblclick.zoom", null);
    camera.nudge(camera.get());
    const timer = setTimeout(() => setEntering(false), 2500);
    return () => {
      clearTimeout(timer);
      select(svg).on(".zoom", null);
      zoomBehaviour.current = null;
    };
  }, [camera]);

  /* ---------- lantern glow follows the beacon ---------- */
  useEffect(() => {
    const n = NODE_BY_ID[targetId];
    const el = lanternRef.current;
    if (!n || !el) return;
    const L = lantern.current;
    if (reduced || typeof requestAnimationFrame !== "function") {
      L.x = n.x;
      L.y = n.y;
      el.setAttribute("cx", String(n.x));
      el.setAttribute("cy", String(n.y));
      return;
    }
    if (L.raf !== null) cancelAnimationFrame(L.raf);
    const step = () => {
      L.x += (n.x - L.x) * LANTERN_LERP;
      L.y += (n.y - L.y) * LANTERN_LERP;
      el.setAttribute("cx", L.x.toFixed(1));
      el.setAttribute("cy", L.y.toFixed(1));
      if (Math.hypot(n.x - L.x, n.y - L.y) > 0.5) L.raf = requestAnimationFrame(step);
      else L.raf = null;
    };
    L.raf = requestAnimationFrame(step);
    return () => {
      if (L.raf !== null) cancelAnimationFrame(L.raf);
    };
  }, [targetId, reduced]);

  /* ---------- effects: all outside React ---------- */
  const nodeGroup = useCallback(
    (id: string) =>
      nodesRef.current?.querySelector<SVGGElement>(`[data-node-id="${id}"] > .g`) ?? null,
    [],
  );

  const particles = useCallback(
    (id: string, color?: string, count = 20) => {
      const n = NODE_BY_ID[id];
      const fx = fxRef.current;
      if (!n || !fx || reduced) return;
      const fill = color ?? n.color ?? COLORS.orange;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 30 + Math.random() * 50;
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", String(n.x));
        c.setAttribute("cy", String(n.y));
        c.setAttribute("r", String(2 + Math.random() * 2.5));
        c.setAttribute("fill", fill);
        fx.appendChild(c);
        const anim = c.animate(
          [
            { transform: "translate(0,0)", opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`, opacity: 0 },
          ],
          { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.1,.8,.3,1)" },
        );
        anim.onfinish = () => c.remove();
      }
      const ring = document.createElementNS(NS, "circle");
      ring.setAttribute("cx", String(n.x));
      ring.setAttribute("cy", String(n.y));
      ring.setAttribute("r", String(n.r));
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", fill);
      ring.setAttribute("stroke-width", "3");
      fx.appendChild(ring);
      const ra = ring.animate(
        [
          { r: n.r, opacity: 0.9 },
          { r: n.r * 3.2, opacity: 0 },
        ] as Keyframe[],
        { duration: 800, easing: "ease-out" },
      );
      ra.onfinish = () => ring.remove();
      nodeGroup(id)?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
        { duration: 520, easing: "cubic-bezier(.2,.9,.2,1.2)" },
      );
    },
    [reduced, nodeGroup],
  );

  /** Radial fill wipe + white flash on a node (reward step 2). */
  const wipe = useCallback(
    (id: string) => {
      const n = NODE_BY_ID[id];
      const fx = fxRef.current;
      if (!n || !fx || reduced) return;
      const r = n.r + Math.min(reps({ progress }, id), 10) * 0.6;
      const w = document.createElementNS(NS, "circle");
      w.setAttribute("cx", String(n.x));
      w.setAttribute("cy", String(n.y));
      w.setAttribute("r", "0");
      w.setAttribute("fill", "#fff");
      fx.appendChild(w);
      const a = w.animate(
        [
          { r: 0, opacity: 0.85 },
          { r: r * 1.15, opacity: 0.35, offset: 0.7 },
          { r: r * 1.15, opacity: 0 },
        ] as Keyframe[],
        { duration: REWARD.wipe, easing: "cubic-bezier(.2,.9,.2,1.2)" },
      );
      a.onfinish = () => w.remove();
      const flash = document.createElementNS(NS, "circle");
      flash.setAttribute("cx", String(n.x));
      flash.setAttribute("cy", String(n.y));
      flash.setAttribute("r", String(r + 6));
      flash.setAttribute("fill", "#fff");
      fx.appendChild(flash);
      const f = flash.animate([{ opacity: 0.7 }, { opacity: 0 }], { duration: REWARD.flash });
      f.onfinish = () => flash.remove();
    },
    [progress, reduced],
  );

  /** Lightning arc: the orange path edge draws itself with a bright core, halo and a spark. */
  const lightning = useCallback(
    (id: string) => {
      const edges = edgesRef.current;
      const fx = fxRef.current;
      if (!edges || !fx) return;
      const paths = edges.querySelectorAll<SVGPathElement>(`path.hl[data-edge-to="${id}"]`);
      paths.forEach((p) => {
        p.classList.remove("draw");
        void p.getBoundingClientRect();
        p.classList.add("draw");
        setTimeout(() => p.classList.remove("draw"), REWARD.arc + 100);
        if (reduced) return;
        const d = p.getAttribute("d") ?? "";
        const halo = document.createElementNS(NS, "path");
        halo.setAttribute("d", d);
        halo.setAttribute("class", "lightning-halo");
        halo.setAttribute("pathLength", "1");
        const core = document.createElementNS(NS, "path");
        core.setAttribute("d", d);
        core.setAttribute("class", "lightning-core");
        core.setAttribute("pathLength", "1");
        fx.append(halo, core);
        for (const el of [halo, core]) {
          const a = el.animate(
            [
              { strokeDashoffset: 1, opacity: 1 },
              { strokeDashoffset: 0, opacity: 1, offset: 0.8 },
              { strokeDashoffset: 0, opacity: 0 },
            ],
            { duration: REWARD.arc + 250, easing: "ease-out" },
          );
          a.onfinish = () => el.remove();
        }
        const spark = document.createElementNS(NS, "circle");
        spark.setAttribute("r", "3.5");
        spark.setAttribute("class", "spark");
        const am = document.createElementNS(NS, "animateMotion");
        am.setAttribute("dur", `${REWARD.arc}ms`);
        am.setAttribute("fill", "freeze");
        am.setAttribute("path", d);
        spark.appendChild(am);
        fx.appendChild(spark);
        const b = (am as SVGAnimateMotionElement & { beginElement?: () => void }).beginElement;
        if (typeof b === "function") b.call(am);
        setTimeout(() => spark.remove(), REWARD.arc + 80);
      });
    },
    [reduced],
  );

  /** The standard reward sequence: dim → wipe → lightning → particles → relight. */
  const reward = useCallback(
    (id: string, color?: string) => {
      const layer = zoomRef.current;
      if (reduced) {
        lightning(id);
        return;
      }
      layer?.classList.add("dimmed");
      setTimeout(() => wipe(id), REWARD.dim);
      setTimeout(() => lightning(id), REWARD.dim + 120);
      setTimeout(
        () => {
          particles(id, color, 22);
          haptic(12);
        },
        REWARD.dim + REWARD.wipe + 160,
      );
      setTimeout(() => layer?.classList.remove("dimmed"), REWARD.total - 250);
    },
    [reduced, wipe, lightning, particles],
  );

  const coolDown = useCallback(() => {
    edgesRef.current?.querySelectorAll<SVGPathElement>("path.hl").forEach((p) => {
      p.animate([{ opacity: 0.95, filter: "none" }, { opacity: 0.55 }], {
        duration: 2500,
        easing: "ease-out",
      });
    });
  }, []);

  useEffect(() => {
    if (!commands.length) return;
    for (const cmd of commands) {
      const run = (c: MapCommand) => {
        switch (c.type) {
          case "burst":
            c.ids.forEach((id, i) =>
              setTimeout(() => particles(id, c.color), i * (c.stagger ?? 110)),
            );
            break;
          case "drawEdges":
            c.ids.forEach((id, i) => setTimeout(() => lightning(id), i * 90));
            break;
          case "zoomTo":
            void camera.flyTo(c.id, { width: c.width });
            break;
          case "fit":
            void camera.fit();
            break;
          case "zoomBy":
            void camera.zoomBy(c.factor);
            break;
          case "coolDown":
            coolDown();
            break;
          case "pushIn":
            void camera.pushIn(c.id);
            break;
          case "pullBack":
            void camera.pullBack();
            break;
          case "reward":
            reward(c.id, c.color);
            break;
        }
      };
      run(cmd);
      consume(cmd.seq);
    }
  }, [commands, consume, particles, lightning, camera, coolDown, reward]);

  /* ---------- render helpers ---------- */
  const edgeClass = (e: GraphEdge): string => {
    const a = NODE_BY_ID[e.s]!;
    const b = NODE_BY_ID[e.t]!;
    const cls = ["edge", e.k];
    if (e.heavy) cls.push("heavy");
    if (e.k === "hl") cls.push(path);
    if (isFogged(a) || isFogged(b)) cls.push("fog");
    if (highlightId && !(e.s === highlightId || e.t === highlightId)) cls.push("dim");
    return cls.join(" ");
  };

  const edgePaths = useMemo(() => EDGES.map((e) => ({ e, d: edgePath(e) })), []);

  return (
    <svg
      ref={svgRef}
      className="map-svg"
      viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Skill map"
      data-testid="skill-map"
      data-path={path}
      data-reduced-motion={reduced ? "true" : undefined}
      onClick={onBackgroundClick}
    >
      <defs>
        <marker
          id="arr"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" />
        </marker>
        <radialGradient id="lantern">
          <stop offset="0%" stopColor={COLORS.orange} stopOpacity={0.16} />
          <stop offset="45%" stopColor={COLORS.orange} stopOpacity={0.05} />
          <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0} />
        </radialGradient>
        <filter id="bloom" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="halo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* far layer: starfield (parallax 0.2×) */}
      <g ref={starsRef} className="stars" aria-hidden>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>

      <g ref={zoomRef} className="world">
        <circle
          ref={lanternRef}
          className="lantern"
          cx={ROOT.x}
          cy={ROOT.y}
          r={LANTERN_R}
          fill="url(#lantern)"
          data-testid="lantern"
        />
        <g ref={edgesRef} className={entering ? "edges-enter" : undefined}>
          {edgePaths.map(({ e, d }, i) => (
            <path
              key={`${e.s}-${e.t}-${e.k}`}
              d={d}
              className={edgeClass(e)}
              markerEnd={e.k === "hl" ? undefined : "url(#arr)"}
              pathLength={1}
              data-edge-to={e.t}
              data-edge-from={e.s}
              style={entering ? { animationDelay: `${200 + i * 4}ms` } : undefined}
            />
          ))}
          <path
            d={rootLoopPath(ROOT)}
            className={`edge hl ${path}`}
            pathLength={1}
            data-edge-to="azair"
          />
        </g>
        <g style={{ display: lit ? undefined : "none" }}>
          {edgePaths
            .filter(({ e }) => e.k === "hl")
            .map(({ e, d }, i) => (
              <circle key={`flow-${e.t}`} r={2.2} className="flow">
                <animateMotion
                  dur={`${5 + ((i * 1.7) % 4)}s`}
                  repeatCount="indefinite"
                  begin={`${-((i * 1.3) % 5)}s`}
                  path={d}
                />
              </circle>
            ))}
        </g>
        <g ref={nodesRef} className={entering ? "nodes-enter" : undefined}>
          {NODES.map((n) => {
            const st = stateOf({ progress, discovered }, n);
            const grow = Math.min(reps({ progress }, n.id), 10) * 0.6;
            const fog = isFogged(n);
            const beacon = n.id === targetId;
            const dim = !!highlightSet && !highlightSet.has(n.id);
            const kind = n.type === "hub" ? "hub" : n.type === "c" ? "collapsed" : "leaf";
            const isExpanded = n.type === "c" && !!expanded[n.id];
            const sign =
              n.type === "hub"
                ? n.id === "hubReed"
                  ? ""
                  : "−"
                : n.type === "c"
                  ? isExpanded
                    ? "−"
                    : "+"
                  : (n.sign ?? "");
            const lp = n.type !== "hub" ? labelPlacement({ ...n, r: n.r + grow }) : null;
            const cls = [
              "node",
              kind,
              st,
              fog ? "fog" : "",
              beacon ? "beacon" : "",
              dim ? "dim" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const delay = Math.hypot(n.x - ROOT.x, n.y - ROOT.y) * 0.9;
            return (
              <g
                key={n.id}
                className={cls}
                transform={`translate(${n.x},${n.y})`}
                style={{ color: n.color ?? "" }}
                data-node-id={n.id}
                data-state={st || undefined}
                data-beacon={beacon ? "true" : undefined}
                data-fog={fog ? "true" : undefined}
                onMouseEnter={() => {
                  if (!focusedId) setHoverId(n.id);
                }}
                onMouseLeave={() => {
                  if (!focusedId) setHoverId(null);
                }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onNodeClick(n);
                }}
                role="button"
                aria-label={n.fw || n.orig}
                tabIndex={fog ? -1 : 0}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onNodeClick(n);
                  }
                }}
              >
                <g className="g" style={entering ? { animationDelay: `${delay}ms` } : undefined}>
                  {n.root && <circle r={n.r + 6} className="root-pulse" />}
                  <g className="bk">
                    <circle r={n.r + 10} className="bk-ring" />
                    <circle r={n.r + 10} className="bk-ring d2" />
                    <g
                      className="bk-bob"
                      style={
                        {
                          "--by": `${-n.r - 30}px`,
                          transform: `translate(0,${-n.r - 30}px)`,
                        } as React.CSSProperties
                      }
                    >
                      <rect x={-22} y={-10} width={44} height={18} rx={9} className="bk-tag" />
                      <text y={3} className="bk-txt">
                        NEXT
                      </text>
                      <path d="M-5,8 L0,14 L5,8z" className="bk-arrow" />
                    </g>
                  </g>
                  {n.hl && <circle r={n.r + 4} className={`ring${warm ? "" : " cold"}`} />}
                  {st === "mastered" && <circle r={n.r + grow + 9} className="mring" />}
                  <circle
                    r={n.r + grow}
                    className="body"
                    fill={n.type === "n" ? n.color : undefined}
                    filter={st === "mastered" ? "url(#bloom)" : undefined}
                  />
                  {sign && <text className={`sign${n.big ? " big" : ""}`}>{sign}</text>}
                  {lp ? (
                    <text
                      key={mode}
                      className="lbl anim-fade"
                      x={lp.dx}
                      y={lp.dy}
                      textAnchor={lp.anchor}
                      transform={`rotate(${lp.rot} ${lp.dx} ${lp.dy})`}
                    >
                      {mode === "fw" ? n.fw : n.orig}
                    </text>
                  ) : (
                    n.fw &&
                    mode === "fw" && (
                      <text className="cluster-lbl anim-fade" y={-n.r - 8} textAnchor="middle">
                        {n.fw}
                      </text>
                    )
                  )}
                </g>
                {isExpanded && (
                  <g className="children">
                    {childPositions(n).map((p, i) => (
                      <g
                        key={i}
                        className="child orbit-in"
                        style={
                          {
                            "--tx": `${p.x}px`,
                            "--ty": `${p.y}px`,
                            animationDelay: `${i * 60}ms`,
                          } as React.CSSProperties
                        }
                      >
                        <line
                          x1={-p.x}
                          y1={-p.y}
                          x2={0}
                          y2={0}
                          stroke="#3a4a63"
                          strokeDasharray="2 3"
                          pathLength={1}
                          className="child-link"
                        />
                        <circle
                          r={6}
                          fill={n.disc ? COLORS.purple : COLORS.blue}
                          stroke="#0b0f17"
                        />
                        <text x={10} y={4}>
                          {n.children?.[i]}
                        </text>
                      </g>
                    ))}
                  </g>
                )}
              </g>
            );
          })}
        </g>
        <g ref={fxRef} className="fx" />
      </g>
    </svg>
  );
}
