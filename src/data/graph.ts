/**
 * The skill map: nodes, hubs, edges and the critical path.
 * Coordinates are in the 1600x900 SVG space used by the original prototype.
 */

export const COLORS = {
  teal: "#3fb3b0",
  blue: "#6a8fd6",
  purple: "#b15ad1",
  green: "#5fd3a6",
  orange: "#f5a623",
} as const;

export type NodeType = "hub" | "n" | "c";
export type LoopId = "read" | "write" | "explain" | "review";
export type LabelAnchor = "r" | "l" | "u" | "d" | "ur" | "ul" | "dr" | "dl";
export type DisciplineId = "zatanna" | "caterina" | "karolyn" | "adiel" | "averi" | "berlin";

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  r: number;
  type: NodeType;
  /** Label from the original hand-drawn image. */
  orig: string;
  /** Framework name. */
  fw: string;
  color?: string;
  sign?: string;
  /** On the critical path (orange ring). */
  hl?: boolean;
  root?: boolean;
  big?: boolean;
  la?: LabelAnchor;
  desc?: string;
  loop?: LoopId | null;
  prompt?: string;
  children?: string[];
  disc?: DisciplineId;
}

type NodeExtra = Omit<GraphNode, "id" | "x" | "y" | "r" | "type" | "orig" | "fw">;

const nodes: GraphNode[] = [];
const add = (
  id: string,
  x: number,
  y: number,
  r: number,
  type: NodeType,
  orig: string,
  fw: string,
  extra: NodeExtra = {},
): void => {
  nodes.push({ id, x, y, r, type, orig, fw, ...extra });
};

const C = COLORS;

add("hubL", 215, 372, 42, "hub", "—", "FOUNDATIONS", {
  desc: "The two stacked skills of elite communication: structuring thought so it lands, and having the words to be precise.",
});
add("azair", 343, 355, 38, "n", "Azair", "Elite Communicator", {
  color: C.teal,
  sign: "+",
  hl: true,
  root: true,
  la: "r",
  desc: "The root. Structure (so ideas land) + vocabulary (so they are precise). Everything on the orange path feeds this node. It lights up as the whole map does.",
  loop: null,
});
add("constance", 240, 268, 15, "n", "Constance", "Structure thought", {
  color: C.green,
  la: "ur",
  loop: "write",
  desc: "Lead with the conclusion, group supporting points, then evidence.",
});
add("giovanni", 285, 293, 14, "n", "Giovanni", "Precise words", {
  color: C.purple,
  la: "ur",
  loop: "read",
  desc: "Choose the exact word, not the biggest one.",
});
add("khya", 118, 418, 15, "n", "Khya", "Ask better questions", {
  color: C.purple,
  la: "dl",
  loop: "explain",
  desc: "Elite communicators are distinguished more by their questions than their statements.",
});
add("aerion", 155, 457, 15, "n", "Aerion", "Clarity test", {
  color: C.blue,
  la: "dl",
  loop: "explain",
  desc: "If you can’t explain it simply to a novice, you don’t understand it.",
});
add("josefina", 128, 303, 16, "c", "(Josefina, …)", "(Credibility, …)", {
  la: "ul",
  children: ["Credibility / ethos", "Expertise signals", "Track record"],
});
add("yaelle", 181, 265, 16, "c", "(Yaelle, …)", "(Empathy, …)", {
  la: "ul",
  children: ["Empathy / pathos", "Audience modelling", "Tone matching"],
});
add("malika", 105, 358, 15, "c", "(Malika, …)", "(Logic, …)", {
  la: "l",
  children: ["Logic / logos", "Evidence hierarchy", "Argument mapping"],
});
add("trexton", 207, 480, 16, "c", "(Trexton, …)", "(Curiosity, …)", {
  la: "d",
  children: ["Socratic questioning", "Follow-up questions", "Reading outside your field"],
});
add("rosaleena", 270, 465, 16, "c", "(Rosaleena, …)", "(Discipline, …)", {
  la: "dr",
  children: ["Daily reps", "Review cadence", "Output quota"],
});
add("hubTL", 520, 207, 36, "hub", "—", "VOCABULARY", {
  desc: "Seven methods for mastering vocabulary across disciplines; etymology is the highest-leverage move.",
});
add("emyah", 630, 240, 32, "n", "Emyah", "Vocabulary Mastery", {
  color: C.blue,
  sign: "+",
  hl: true,
  la: "r",
  loop: "read",
  desc: "Recognition vocabulary becomes usable vocabulary only through output.",
});
add("sebastian", 575, 297, 23, "n", "Sebastian", "Etymology & Morphology", {
  color: C.blue,
  sign: "+",
  hl: true,
  la: "dr",
  loop: "review",
  desc: "~90% of technical vocabulary decodes from a few hundred Latin/Greek roots, prefixes and suffixes.",
});
add("treston", 435, 262, 15, "n", "Treston", "Spaced Repetition", {
  color: C.blue,
  la: "dl",
  loop: "review",
  desc: "Anki / Leitner. Capture words in context; review on a schedule.",
});
add("rhylen", 420, 218, 15, "n", "Rhylen", "Active Production", {
  color: C.green,
  la: "l",
  loop: "write",
  desc: "Use three new words in writing or speech within 24 hours.",
});
add("kalman", 425, 160, 16, "c", "(Kalman, …)", "(Collocation, …)", {
  la: "ul",
  children: ["Learn words in natural pairings", "“mitigate risk”, “robust evidence”"],
});
add("lynnlee", 462, 118, 16, "c", "(Lynnlee, …)", "(Register, …)", {
  la: "ul",
  children: ["Casual → professional → academic → literary", "fix → resolve → remediate → rectify"],
});
add("hebe", 520, 100, 16, "c", "(Hebe, …)", "(Immersion, …)", {
  la: "u",
  children: ["Read primary literature, not summaries", "Per-discipline glossary"],
});
add("khaysen", 580, 118, 16, "c", "(Khaysen, …)", "(Precision, …)", {
  la: "ur",
  children: ["Orwell: never a long word where a short one will do"],
});
add("bryshaun", 618, 165, 16, "c", "(Bryshaun, …)", "(Latin roots, …)", {
  la: "ur",
  children: ["pre-, sub-, trans-", "-duc-, -scrib-, -ject-"],
});
add("khyng", 478, 303, 15, "c", "(Khyng, …)", "(Greek roots, …)", {
  la: "dl",
  children: ["-logy, -graph, -phil", "hyper-, hypo-, meta-"],
});
add("hubC", 848, 318, 28, "hub", "—", "STRUCTURE & DELIVERY", {
  desc: "The nine frameworks for structuring and delivering ideas.",
});
add("mir", 808, 232, 17, "n", "Mir", "Pyramid Principle", {
  color: C.green,
  hl: true,
  la: "ul",
  loop: "write",
  desc: "Minto. Conclusion first → grouped points → evidence. If you learn one framework, learn this.",
  prompt:
    "State your conclusion in one sentence, then give 2–3 grouped reasons, then one piece of evidence for each.",
});
add("jatavia", 862, 225, 17, "n", "Jatavia", "PREP", {
  color: C.green,
  hl: true,
  la: "ur",
  loop: "write",
  desc: "Point – Reason – Example – Point. Answer any question coherently in 30–60 seconds.",
  prompt: "Point: your claim. Reason: why. Example: a concrete case. Point: restate the claim.",
});
add("monireoluwa", 908, 252, 17, "n", "Monireoluwa", "Ethos · Pathos · Logos", {
  color: C.purple,
  hl: true,
  la: "ur",
  loop: "write",
  desc: "Credibility, emotion, logic. Most persuasion failures are an imbalance of the three.",
  prompt:
    "Establish why you are credible, make the reader feel the stakes, then give the logical case.",
});
add("jiovanna", 935, 302, 17, "n", "Jiovanna", "SCQA", {
  color: C.green,
  hl: true,
  la: "r",
  loop: "write",
  desc: "Situation – Complication – Question – Answer. Builds tension before resolving it.",
  prompt: "Situation (stable context) → Complication (what changed) → Question it raises → Answer.",
});
add("kayceon", 772, 272, 17, "n", "Kayceon", "Storytelling spine", {
  color: C.green,
  hl: true,
  la: "ul",
  loop: "write",
  desc: "“Once upon a time… every day… until one day… because of that… until finally…”",
  prompt: "Use the Pixar spine beats in order; make the “until one day” the turning point.",
});
add("sheyenne", 762, 328, 17, "n", "Sheyenne", "Monroe’s Sequence", {
  color: C.purple,
  hl: true,
  la: "l",
  loop: "write",
  desc: "Attention → Need → Satisfaction → Visualization → Action.",
  prompt:
    "Hook attention, name the need, present the solution, paint the future, ask for the action.",
});
add("gram", 795, 377, 17, "n", "Gram", "Feynman Technique", {
  color: C.blue,
  hl: true,
  la: "dl",
  loop: "explain",
  desc: "Explain it simply to a novice or you don’t understand it.",
});
add("breann", 847, 395, 17, "n", "Breann", "Nonviolent Communication", {
  color: C.green,
  hl: true,
  la: "d",
  loop: "write",
  desc: "Observation → Feeling → Need → Request.",
  prompt: "Observe without judging, name the feeling, name the need, make a concrete request.",
});
add("pesach", 898, 378, 17, "n", "Pesach", "Active listening / Socratic", {
  color: C.blue,
  hl: true,
  la: "dr",
  loop: "explain",
  desc: "Listen to understand; question to uncover.",
});
add("hubO", 1082, 235, 17, "hub", "—", "READ", {
  desc: "Daily step 1 — reading outside your discipline.",
});
add("ovi", 1008, 198, 17, "n", "Ovi", "Read 30 min outside your field", {
  color: C.purple,
  hl: true,
  la: "ul",
  loop: "read",
  desc: "Step 1 of the daily stack.",
});
add("precise", 1120, 155, 15, "n", "Precise", "Log 5 words with sentences", {
  color: C.purple,
  la: "ur",
  loop: "read",
  desc: "Five words per session, each with the sentence it lived in.",
});
add("hubM", 1372, 228, 17, "hub", "—", "BOOKS", { desc: "Books worth owning." });
add("markai", 1192, 213, 29, "n", "Markai", "The Pyramid Principle — Minto", {
  color: C.teal,
  sign: "−",
  hl: true,
  la: "ur",
  loop: "write",
  desc: "The backbone of consulting, executive and academic communication.",
});
add("lanson", 1286, 228, 13, "n", "Lanson", "Word Power Made Easy — Lewis", {
  color: C.purple,
  la: "r",
  loop: "read",
  desc: "Vocabulary through roots, prefixes and suffixes.",
});
add("amerika", 1335, 150, 15, "n", "Amerika", "On Writing Well — Zinsser", {
  color: C.purple,
  la: "ul",
  loop: "write",
  desc: "Clarity, simplicity, brevity, humanity.",
});
add("hillary", 1430, 162, 15, "n", "Hillary", "Thank You for Arguing — Heinrichs", {
  color: C.purple,
  la: "ur",
  loop: "write",
  desc: "Applied Aristotle in daily life.",
});
add("azai", 1455, 253, 15, "n", "Azai", "Nonviolent Communication — Rosenberg", {
  color: C.green,
  la: "r",
  loop: "write",
  desc: "Observation → Feeling → Need → Request.",
});
add("aayliah", 1372, 310, 15, "n", "Aayliah", "Orwell’s rule", {
  color: C.green,
  hl: true,
  la: "dr",
  loop: "write",
  desc: "“Never use a long word where a short one will do.”",
});
add("hubR", 1155, 450, 32, "hub", "—", "DAILY STACK", {
  desc: "Read → write → explain aloud → review.",
});
add("hubReed", 1050, 497, 10, "hub", "", "", {});
add("reed", 955, 560, 20, "n", "Reed", "Explain aloud, Feynman-style", {
  color: C.teal,
  sign: "+",
  hl: true,
  la: "dl",
  loop: "explain",
  desc: "Step 3 — explain one concept aloud in under two minutes.",
});
add("joann", 992, 605, 15, "c", "(Joann, …)", "(Weekly review, …)", {
  la: "dl",
  children: ["Replay one recording", "Note filler words", "Pick next week’s concept"],
});
add("olanna", 1168, 678, 15, "c", "(Olanna, …)", "(Monthly audit, …)", {
  la: "d",
  children: ["Count words retained", "Re-rank frameworks by use", "Prune the deck"],
});
add("hubS", 1075, 662, 15, "hub", "—", "WRITE", { desc: "Daily step 2 — writing." });
add("shaunak", 998, 695, 15, "n", "Shaunak", "One PREP paragraph daily", {
  color: C.purple,
  la: "dl",
  loop: "write",
  desc: "Step 2 — one structured paragraph on something you read.",
});
add("jabbar", 1112, 740, 15, "n", "Jabbar", "Per-discipline glossary", {
  color: C.teal,
  la: "dr",
  loop: "read",
  desc: "A glossary per field you read in; feeds the SRS deck.",
});
add("hubK", 1348, 640, 15, "hub", "—", "REVIEW", {
  desc: "Daily step 4 — spaced-repetition review.",
});
add("kymberlee", 1272, 673, 15, "n", "Kymberlee", "Review SRS deck", {
  color: C.purple,
  hl: true,
  la: "dl",
  loop: "review",
  desc: "Step 4 — review your spaced-repetition deck every day.",
});
add("elson", 1385, 565, 15, "n", "Elson", "Anki", {
  color: C.teal,
  la: "ur",
  loop: "review",
  desc: "Digital spaced repetition.",
});
add("prinston", 1410, 702, 15, "n", "Prinston", "Leitner box", {
  color: C.teal,
  la: "dr",
  loop: "review",
  desc: "Five boxes; promote on recall.",
});
add("hubB", 1385, 437, 15, "hub", "—", "OUTPUT", {
  desc: "Turn recognition vocabulary into usable vocabulary.",
});
add("besan", 1443, 375, 15, "n", "Besan", "3 new words within 24h", {
  color: C.purple,
  la: "ur",
  loop: "write",
  desc: "Active production rule.",
});
add("angelita", 1443, 492, 15, "n", "Angelita", "Register ladders", {
  color: C.purple,
  la: "dr",
  loop: "read",
  desc: "casual → professional → academic → literary.",
});
add("hubBig", 542, 568, 82, "hub", "—", "ANY DISCIPLINE", {
  big: true,
  desc: "Each collapsed group is a discipline pack: glossary seeds, primary literature and register.",
});
add("zatanna", 305, 630, 40, "c", "(Zatanna, …)", "(Medicine, …)", {
  big: true,
  la: "l",
  disc: "zatanna",
  children: ["Primary literature: journals", "Greek/Latin anatomy roots", "Clinical register"],
});
add("caterina", 372, 735, 40, "c", "(Caterina, …)", "(Law, …)", {
  big: true,
  la: "dl",
  disc: "caterina",
  children: ["Case law & statutes", "Latin maxims", "Forensic register"],
});
add("karolyn", 470, 785, 32, "c", "(Karolyn, …)", "(Science, …)", {
  big: true,
  la: "d",
  disc: "karolyn",
  children: ["Papers & methods sections", "Greek roots: -logy, -meter", "Hedged register"],
});
add("adiel", 575, 805, 42, "c", "(Adiel, …)", "(Philosophy, …)", {
  big: true,
  la: "d",
  disc: "adiel",
  children: ["Foundational texts", "Greek/German terms", "Argument structure"],
});
add("averi", 668, 758, 30, "c", "(Averi, …)", "(Business, …)", {
  big: true,
  la: "dr",
  disc: "averi",
  children: ["Pyramid memos", "Executive summaries", "SCQA openings"],
});
add("berlin", 732, 695, 30, "c", "(Berlin, …)", "(Engineering, …)", {
  big: true,
  la: "dr",
  disc: "berlin",
  children: ["Specs & RFCs", "Feynman explanations", "Collocations: “robust”, “fault-tolerant”"],
});

export const NODES: readonly GraphNode[] = nodes;

export const NODE_BY_ID: Readonly<Record<string, GraphNode>> = Object.fromEntries(
  nodes.map((n) => [n.id, n]),
);

export function getNode(id: string): GraphNode {
  const n = NODE_BY_ID[id];
  if (!n) throw new Error(`Unknown node: ${id}`);
  return n;
}

export const HUB_OF: Readonly<Record<string, readonly string[]>> = {
  hubL: [
    "azair",
    "constance",
    "giovanni",
    "khya",
    "aerion",
    "josefina",
    "yaelle",
    "malika",
    "trexton",
    "rosaleena",
  ],
  hubTL: [
    "emyah",
    "sebastian",
    "treston",
    "rhylen",
    "kalman",
    "lynnlee",
    "hebe",
    "khaysen",
    "bryshaun",
    "khyng",
  ],
  hubC: [
    "mir",
    "jatavia",
    "monireoluwa",
    "jiovanna",
    "kayceon",
    "sheyenne",
    "gram",
    "breann",
    "pesach",
  ],
  hubO: ["ovi", "precise"],
  hubM: ["markai", "lanson", "amerika", "hillary", "azai", "aayliah"],
  hubR: ["hubO", "hubM", "hubReed", "joann", "olanna", "hubS", "hubK", "hubB", "hubC"],
  hubReed: ["reed"],
  hubS: ["shaunak", "jabbar"],
  hubK: ["kymberlee", "elson", "prinston"],
  hubB: ["besan", "angelita"],
  hubBig: [
    "zatanna",
    "caterina",
    "karolyn",
    "adiel",
    "averi",
    "berlin",
    "hubL",
    "hubTL",
    "hubR",
    "hubC",
  ],
};

export function hubOfNode(id: string): string | null {
  for (const h of Object.keys(HUB_OF)) {
    if (HUB_OF[h]?.includes(id)) return h;
  }
  return null;
}

export type EdgeKind = "dot" | "arc" | "hl";

export interface GraphEdge {
  s: string;
  t: string;
  k: EdgeKind;
  bend?: number;
  heavy?: boolean;
}

/** The critical path from the root, in route order. */
export const PATH: readonly string[] = [
  "mir",
  "jatavia",
  "monireoluwa",
  "jiovanna",
  "kayceon",
  "sheyenne",
  "gram",
  "breann",
  "pesach",
  "emyah",
  "sebastian",
  "ovi",
  "markai",
  "aayliah",
  "reed",
  "kymberlee",
];

function buildEdges(): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const h of Object.keys(HUB_OF)) {
    for (const c of HUB_OF[h] ?? []) edges.push({ s: c, t: h, k: "dot" });
  }
  const arcs: Array<[string, string]> = [
    ["emyah", "hubC"],
    ["sebastian", "hubC"],
    ["emyah", "jiovanna"],
    ["sebastian", "jiovanna"],
    ["markai", "hubReed"],
    ["markai", "hubC"],
    ["reed", "hubR"],
    ["kymberlee", "hubR"],
    ["ovi", "hubR"],
    ["aayliah", "hubR"],
    ["azair", "hubTL"],
    ["azair", "hubR"],
  ];
  arcs.forEach(([s, t], i) => edges.push({ s, t, k: "arc", bend: (i % 2 ? 1 : -1) * 0.18 }));
  PATH.forEach((t, i) => {
    const bend =
      i < 9
        ? 0.46 + (i % 3) * 0.03
        : t === "emyah" || t === "sebastian"
          ? 0.55
          : 0.3 + (i % 3) * 0.04;
    edges.push({ s: "azair", t, k: "hl", bend, heavy: i < 9 });
  });
  return edges;
}

export const EDGES: readonly GraphEdge[] = buildEdges();

/** Practisable leaf nodes (everything that contributes to mastery). */
export const LEAVES: readonly GraphNode[] = nodes.filter((n) => n.type === "n" && !n.root);

/** The ids of neighbours of a node, including itself. */
export function neighbours(id: string): Set<string> {
  const s = new Set<string>([id]);
  for (const e of EDGES) {
    if (e.s === id) s.add(e.t);
    if (e.t === id) s.add(e.s);
  }
  return s;
}

/** Home camera / viewBox. */
export const VIEWBOX = { x: -30, y: 20, w: 1600, h: 900 } as const;
