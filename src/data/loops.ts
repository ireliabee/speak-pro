import type { LoopId } from "./graph";

export interface LoopDef {
  title: string;
  icon: string;
  /** Nodes that grow by one rep each time this loop completes. */
  nodes: readonly string[];
  desc: string;
}

export const LOOPS: Readonly<Record<LoopId, LoopDef>> = {
  read: {
    title: "Read & log",
    icon: "📖",
    nodes: ["ovi", "precise", "emyah", "giovanni", "jabbar", "lanson", "angelita"],
    desc: "30 min outside your field, then log 5 words",
  },
  write: {
    title: "Write",
    icon: "✍️",
    nodes: ["shaunak", "constance", "rhylen", "markai", "aayliah", "besan"],
    desc: "One structured paragraph, scored",
  },
  explain: {
    title: "Explain aloud",
    icon: "🎙️",
    nodes: ["reed", "gram", "aerion", "pesach", "khya"],
    desc: "2 minutes, Feynman-style",
  },
  review: {
    title: "Review deck",
    icon: "🃏",
    nodes: ["kymberlee", "elson", "prinston", "treston", "sebastian"],
    desc: "Spaced-repetition cards",
  },
};

export const LOOP_IDS = Object.keys(LOOPS) as LoopId[];

/** Frameworks you can write against, in pill order. */
export const WRITE_FRAMEWORKS: readonly string[] = [
  "jatavia",
  "mir",
  "jiovanna",
  "monireoluwa",
  "kayceon",
  "sheyenne",
  "breann",
];

/** Concepts you can explain aloud, in pill order. */
export const EXPLAIN_CONCEPTS: readonly string[] = [
  "mir",
  "jatavia",
  "jiovanna",
  "sebastian",
  "monireoluwa",
  "breann",
  "gram",
];
