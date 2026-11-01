import { NODE_BY_ID, type GraphEdge, type GraphNode, type LabelAnchor } from "@/data/graph";

interface Pt {
  x: number;
  y: number;
}

export const curveControl = (s: Pt, t: Pt, b: number): Pt => {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  return { x: (s.x + t.x) / 2 - dy * b, y: (s.y + t.y) / 2 + dx * b };
};

/** Point at distance r from t, along the line t -> f. */
export const endpoint = (f: Pt, t: Pt, r: number): Pt => {
  const dx = f.x - t.x;
  const dy = f.y - t.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: t.x + (dx / d) * r, y: t.y + (dy / d) * r };
};

export function edgePath(e: GraphEdge): string {
  const s = NODE_BY_ID[e.s];
  const t = NODE_BY_ID[e.t];
  if (!s || !t) return "";
  if (e.k === "dot") {
    const a = endpoint(t, s, s.r + 1);
    const b = endpoint(s, t, t.r + 2);
    return `M${a.x},${a.y}L${b.x},${b.y}`;
  }
  const c = curveControl(s, t, e.bend ?? 0);
  const a = endpoint(c, s, s.r);
  const b = endpoint(c, t, t.r + 2);
  return `M${a.x},${a.y}Q${c.x},${c.y} ${b.x},${b.y}`;
}

/** The little self-loop on the root node. */
export function rootLoopPath(r: GraphNode): string {
  return `M${r.x - r.r + 4},${r.y - 10} C${r.x - r.r - 40},${r.y - 30} ${r.x - r.r - 40},${r.y + 30} ${r.x - r.r + 4},${r.y + 10}`;
}

export interface LabelPlacement {
  dx: number;
  dy: number;
  anchor: "start" | "middle" | "end";
  rot: number;
}

export function labelPlacement(n: GraphNode): LabelPlacement {
  const o = n.r + 6;
  const table: Record<LabelAnchor, LabelPlacement> = {
    r: { dx: o, dy: 0, anchor: "start", rot: 0 },
    l: { dx: -o, dy: 0, anchor: "end", rot: 0 },
    u: { dx: 0, dy: -o - 2, anchor: "middle", rot: 0 },
    d: { dx: 0, dy: o + 9, anchor: "middle", rot: 0 },
    ur: { dx: o * 0.7, dy: -o * 0.7, anchor: "start", rot: -35 },
    ul: { dx: -o * 0.7, dy: -o * 0.7, anchor: "end", rot: 35 },
    dr: { dx: o * 0.7, dy: o * 0.7 + 6, anchor: "start", rot: 35 },
    dl: { dx: -o * 0.7, dy: o * 0.7 + 6, anchor: "end", rot: -35 },
  };
  return table[n.la ?? "r"];
}

/** Positions of a collapsed node's children when expanded. */
export function childPositions(n: GraphNode): Pt[] {
  const kids = n.children ?? [];
  const R = n.r + (n.big ? 70 : 34);
  const a0: Record<LabelAnchor, number> = {
    l: Math.PI,
    d: Math.PI / 2,
    u: -Math.PI / 2,
    dl: Math.PI * 0.75,
    dr: Math.PI * 0.25,
    ul: -Math.PI * 0.75,
    ur: -Math.PI * 0.25,
    r: 0,
  };
  const base = a0[n.la ?? "r"];
  return kids.map((_, i) => {
    const a = base + (i - (kids.length - 1) / 2) * 0.55;
    return { x: Math.cos(a) * R, y: Math.sin(a) * R };
  });
}

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
