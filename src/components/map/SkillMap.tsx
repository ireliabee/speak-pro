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
import { pathWarm } from "@/lib/dates";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore, type MapCommand } from "@/store/useUiStore";
import { childPositions, easeInOutCubic, edgePath, labelPlacement, rootLoopPath } from "./geometry";

export interface SkillMapProps {
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick: () => void;
}

const ROOT = NODE_BY_ID.azair!;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 5.3;

interface Camera {
  x: number;
  y: number;
  k: number;
}

const HOME: Camera = { x: VIEWBOX.x + VIEWBOX.w / 2, y: VIEWBOX.y + VIEWBOX.h / 2, k: 1 };

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

export default function SkillMap({ onNodeClick, onBackgroundClick }: SkillMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<SVGGElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  const edgesRef = useRef<SVGGElement>(null);
  const nodesRef = useRef<SVGGElement>(null);
  const zoomBehaviour = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const camRef = useRef<Camera>(HOME);
  const animRef = useRef<number | null>(null);

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [entering, setEntering] = useState(true);

  const progress = useAppStore((s) => s.progress);
  const discovered = useAppStore((s) => s.discovered);
  const chapters = useAppStore((s) => s.chapters);
  const disc = useAppStore((s) => s.disc);
  const expanded = useAppStore((s) => s.expanded);
  const mode = useAppStore((s) => s.mode);
  const streakLast = useAppStore((s) => s.streak.last);
  const focusedId = useUiStore((s) => s.focusedId);
  const commands = useUiStore((s) => s.commands);
  const consume = useUiStore((s) => s.consume);

  const warm = pathWarm(streakLast);
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
    camRef.current = c;
    const svg = svgRef.current;
    const z = zoomBehaviour.current;
    if (!svg || !z) return;
    z.transform(select(svg), cameraToTransform(c));
  }, []);

  const animateCamera = useCallback(
    (to: Camera, dur = 700) => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      const from = { ...camRef.current };
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        const k = easeInOutCubic(t);
        applyCamera({
          x: from.x + (to.x - from.x) * k,
          y: from.y + (to.y - from.y) * k,
          k: from.k + (to.k - from.k) * k,
        });
        if (t < 1) animRef.current = requestAnimationFrame(step);
        else animRef.current = null;
      };
      animRef.current = requestAnimationFrame(step);
    },
    [applyCamera],
  );

  const zoomTo = useCallback(
    (id: string, width = 700) => {
      const n = NODE_BY_ID[id];
      if (!n) return;
      animateCamera({ x: n.x, y: n.y, k: VIEWBOX.w / width });
    },
    [animateCamera],
  );

  const zoomBy = useCallback(
    (f: number) => {
      const c = camRef.current;
      const k = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, c.k / f));
      animateCamera({ ...c, k }, 300);
    },
    [animateCamera],
  );

  useEffect(() => {
    const svg = svgRef.current;
    const g = zoomRef.current;
    if (!svg || !g) return;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .filter((ev: Event) => {
        // Let clicks on nodes through; pan/zoom from anywhere else.
        if (ev.type === "mousedown" || ev.type === "touchstart") {
          const target = ev.target as Element | null;
          if (target?.closest?.(".node")) return false;
          // d3-drag needs a window to suppress text selection; synthetic events may lack one.
          if (!(ev as MouseEvent).view) return false;
        }
        return !(ev as MouseEvent).ctrlKey || ev.type === "wheel";
      })
      .on("zoom", (ev) => {
        const t = ev.transform as ZoomTransform;
        g.setAttribute("transform", t.toString());
        camRef.current = transformToCamera(t);
      });
    zoomBehaviour.current = z;
    select(svg).call(z).on("dblclick.zoom", null);
    z.transform(select(svg), cameraToTransform(HOME));
    const timer = setTimeout(() => setEntering(false), 2500);
    return () => {
      clearTimeout(timer);
      select(svg).on(".zoom", null);
      zoomBehaviour.current = null;
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  /* ---------- effects: bursts, edge draws ---------- */
  const burst = useCallback((id: string, color?: string) => {
    const n = NODE_BY_ID[id];
    const fx = fxRef.current;
    const nodes = nodesRef.current;
    if (!n || !fx) return;
    const NS = "http://www.w3.org/2000/svg";
    const fill = color ?? n.color ?? COLORS.orange;
    for (let i = 0; i < 18; i++) {
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
    const el = nodes?.querySelector<SVGGElement>(`[data-node-id="${id}"] > .g`);
    el?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
      { duration: 520, easing: "cubic-bezier(.2,.9,.2,1.2)" },
    );
  }, []);

  const drawEdgesTo = useCallback((ids: string[]) => {
    const edges = edgesRef.current;
    if (!edges) return;
    for (const id of ids) {
      edges.querySelectorAll<SVGPathElement>(`path.hl[data-edge-to="${id}"]`).forEach((p) => {
        p.classList.remove("draw");
        void p.getBoundingClientRect();
        p.classList.add("draw");
        setTimeout(() => p.classList.remove("draw"), 1000);
      });
    }
  }, []);

  const coolDown = useCallback(() => {
    edgesRef.current?.querySelectorAll<SVGPathElement>("path.hl").forEach((p) => {
      p.animate([{ opacity: 0.95 }, { opacity: 0.6 }], { duration: 2400, easing: "ease-out" });
    });
  }, []);

  useEffect(() => {
    if (!commands.length) return;
    for (const cmd of commands) {
      const run = (c: MapCommand) => {
        switch (c.type) {
          case "burst":
            c.ids.forEach((id, i) => setTimeout(() => burst(id, c.color), i * (c.stagger ?? 110)));
            break;
          case "drawEdges":
            drawEdgesTo(c.ids);
            break;
          case "zoomTo":
            zoomTo(c.id, c.width);
            break;
          case "fit":
            animateCamera(HOME);
            break;
          case "zoomBy":
            zoomBy(c.factor);
            break;
          case "coolDown":
            coolDown();
            break;
        }
      };
      run(cmd);
      consume(cmd.seq);
    }
  }, [commands, consume, burst, drawEdgesTo, zoomTo, zoomBy, animateCamera, coolDown]);

  /* ---------- render helpers ---------- */
  const edgeClass = (e: GraphEdge): string => {
    const a = NODE_BY_ID[e.s]!;
    const b = NODE_BY_ID[e.t]!;
    const cls = ["edge", e.k];
    if (e.heavy) cls.push("heavy");
    if (e.k === "hl" && !warm) cls.push("cold");
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
      </defs>
      <g ref={zoomRef}>
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
            className={`edge hl${warm ? "" : " cold"}`}
            pathLength={1}
            data-edge-to="azair"
          />
        </g>
        <g style={{ display: warm ? undefined : "none" }}>
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
            const lp = n.type !== "hub" ? labelPlacement(n) : null;
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
                  />
                  {sign && <text className={`sign${n.big ? " big" : ""}`}>{sign}</text>}
                  {lp ? (
                    <text
                      className="lbl"
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
                      <text className="cluster-lbl" y={-n.r - 8} textAnchor="middle">
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
                        className="child anim-pop"
                        transform={`translate(${p.x},${p.y})`}
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <line
                          x1={-p.x}
                          y1={-p.y}
                          x2={0}
                          y2={0}
                          stroke="#3a4a63"
                          strokeDasharray="2 3"
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
        <g ref={fxRef} />
      </g>
    </svg>
  );
}
