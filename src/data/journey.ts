import type { LoopId } from "./graph";
import type { AppState } from "@/store/state";

export type ChapterAction =
  | { type: "focus"; node: string }
  | { type: "disc" }
  | { type: "loop"; loop: LoopId; node?: string };

export interface Chapter {
  id: string;
  /** Node the chapter lights up / the beacon sits on. */
  node: string;
  title: string;
  lesson: string;
  objective: string;
  action: ChapterAction;
  xp: number;
  /** Pure predicate over state: has the objective been met? */
  check: (s: AppState) => boolean;
}

export const JOURNEY: readonly Chapter[] = [
  {
    id: "meet",
    node: "azair",
    title: "Meet your map",
    lesson:
      "This map is you. Every node is a skill; it starts dark and lights up as you practise. The orange route is your journey — we take it one chapter at a time.",
    objective: "Click the glowing node to begin",
    action: { type: "focus", node: "azair" },
    xp: 20,
    check: (s) => !!s.flags.metRoot,
  },
  {
    id: "disc",
    node: "hubBig",
    title: "Choose your discipline",
    lesson:
      "Elite vocabulary is built inside a field, not in the abstract. Pick the discipline you read in most — its glossary seeds your first cards.",
    objective: "Pick a discipline pack",
    action: { type: "disc" },
    xp: 30,
    check: (s) => !!s.disc,
  },
  {
    id: "read1",
    node: "ovi",
    title: "First words",
    lesson:
      "Step 1 of the daily stack: read 30 minutes outside your own field and log 5 words — each with the sentence it lived in. Context is what makes a word stick.",
    objective: "Log 5 words from something you read",
    action: { type: "loop", loop: "read" },
    xp: 60,
    check: (s) => s.words.length >= 5,
  },
  {
    id: "review1",
    node: "kymberlee",
    title: "Your first review",
    lesson:
      "Passive reading never retains words. Spaced repetition does: a card you recall gets promoted to a later box; one you miss comes back tomorrow.",
    objective: "Review 5 cards",
    action: { type: "loop", loop: "review" },
    xp: 60,
    check: (s) => s.reviewed >= 5,
  },
  {
    id: "prep",
    node: "jatavia",
    title: "PREP",
    lesson:
      "Point → Reason → Example → Point. It is the spoken pyramid: it lets you answer any question coherently in 30–60 seconds. Make the claim, say why, show one case, restate the claim.",
    objective: "Write a PREP paragraph scoring 60+",
    action: { type: "loop", loop: "write", node: "jatavia" },
    xp: 100,
    check: (s) => (s.best.jatavia ?? 0) >= 60,
  },
  {
    id: "pyramid",
    node: "mir",
    title: "The Pyramid Principle",
    lesson:
      "Minto: lead with the conclusion, then grouped supporting points, then evidence. Readers decide in the first sentence whether to keep going. If you learn one framework, learn this.",
    objective: "Write a Pyramid paragraph scoring 60+",
    action: { type: "loop", loop: "write", node: "mir" },
    xp: 100,
    check: (s) => (s.best.mir ?? 0) >= 60,
  },
  {
    id: "aloud",
    node: "reed",
    title: "Say it aloud",
    lesson:
      "Step 3 of the daily stack: explain one concept out loud, to an imaginary 12-year-old, in under two minutes. Speaking exposes gaps that writing hides.",
    objective: "Complete one explain-aloud session",
    action: { type: "loop", loop: "explain", node: "jatavia" },
    xp: 80,
    check: (s) => s.counts.explain >= 1,
  },
  {
    id: "etym",
    node: "sebastian",
    title: "Etymology & morphology",
    lesson:
      "Around 90% of technical vocabulary decodes from a few hundred Latin and Greek roots, prefixes and suffixes. When you review, say the root out loud — it is the highest-leverage habit on this map.",
    objective: "Review 15 cards in total",
    action: { type: "loop", loop: "review" },
    xp: 80,
    check: (s) => s.reviewed >= 15,
  },
  {
    id: "scqa",
    node: "jiovanna",
    title: "SCQA",
    lesson:
      "Situation → Complication → Question → Answer. How to open anything: a stable situation, what changed, the question that raises, your answer. Tension first, then resolution.",
    objective: "Write an SCQA paragraph scoring 60+",
    action: { type: "loop", loop: "write", node: "jiovanna" },
    xp: 100,
    check: (s) => (s.best.jiovanna ?? 0) >= 60,
  },
  {
    id: "ethos",
    node: "monireoluwa",
    title: "Ethos · Pathos · Logos",
    lesson:
      "Aristotle: credibility, emotion, logic. Most persuasion failures are an imbalance — all logic and no stakes, or all feeling and no proof.",
    objective: "Write a persuasive paragraph scoring 60+",
    action: { type: "loop", loop: "write", node: "monireoluwa" },
    xp: 100,
    check: (s) => (s.best.monireoluwa ?? 0) >= 60,
  },
  {
    id: "story",
    node: "kayceon",
    title: "The story spine",
    lesson:
      "“Once upon a time… every day… until one day… because of that… until finally…” Data is forgotten; stories are not. Put your point on the spine.",
    objective: "Write a story-spine paragraph scoring 60+",
    action: { type: "loop", loop: "write", node: "kayceon" },
    xp: 100,
    check: (s) => (s.best.kayceon ?? 0) >= 60,
  },
  {
    id: "monroe",
    node: "sheyenne",
    title: "Monroe’s Motivated Sequence",
    lesson:
      "Attention → Need → Satisfaction → Visualization → Action. The template behind most great persuasive speeches — and most good pitches.",
    objective: "Write a Monroe paragraph scoring 60+",
    action: { type: "loop", loop: "write", node: "sheyenne" },
    xp: 100,
    check: (s) => (s.best.sheyenne ?? 0) >= 60,
  },
  {
    id: "feyn",
    node: "gram",
    title: "The Feynman test",
    lesson:
      "If you can’t explain it simply, you don’t understand it. Two more sessions aloud; pass all three honesty checks at least once.",
    objective: "3 explain-aloud sessions, one with 3/3 checks",
    action: { type: "loop", loop: "explain", node: "mir" },
    xp: 100,
    check: (s) => s.counts.explain >= 3 && !!s.flags.feynman3,
  },
  {
    id: "nvc",
    node: "breann",
    title: "Nonviolent Communication",
    lesson:
      "Rosenberg: Observation → Feeling → Need → Request. For hard conversations and feedback — observe without judging, name the feeling and need, make one concrete request.",
    objective: "Write an NVC paragraph scoring 60+",
    action: { type: "loop", loop: "write", node: "breann" },
    xp: 100,
    check: (s) => (s.best.breann ?? 0) >= 60,
  },
  {
    id: "socratic",
    node: "pesach",
    title: "Questions over statements",
    lesson:
      "Elite communicators are distinguished more by their questions than their statements. In your next session aloud, end with the one question a sceptic would ask — and answer it.",
    objective: "5 explain-aloud sessions in total",
    action: { type: "loop", loop: "explain", node: "jiovanna" },
    xp: 100,
    check: (s) => s.counts.explain >= 5,
  },
  {
    id: "orwell",
    node: "aayliah",
    title: "Orwell’s rule",
    lesson:
      "Never use a long word where a short one will do. Elite vocabulary is the exact word, not the biggest. Write a paragraph with zero very long words and a score of 80+.",
    objective: "Write any paragraph: 80+ with 0 long words",
    action: { type: "loop", loop: "write", node: "jatavia" },
    xp: 120,
    check: (s) => !!s.flags.orwell,
  },
  {
    id: "minto",
    node: "markai",
    title: "Read the source",
    lesson:
      "Minto’s book is the backbone of consulting and executive writing. Read it — or any primary text in your field — and keep logging. 30 words in the deck unlocks the book.",
    objective: "Reach 30 logged words",
    action: { type: "loop", loop: "read" },
    xp: 120,
    check: (s) => s.words.length >= 30,
  },
  {
    id: "vocab",
    node: "emyah",
    title: "Vocabulary mastery",
    lesson:
      "Recognition vocabulary becomes usable vocabulary only through output. 50 words in the deck, 50 reviews, and you have a working system.",
    objective: "50 words logged and 50 reviews",
    action: { type: "loop", loop: "review" },
    xp: 150,
    check: (s) => s.words.length >= 50 && s.reviewed >= 50,
  },
  {
    id: "elite",
    node: "azair",
    title: "Elite Communicator",
    lesson:
      "You have walked the whole path. From here the map is yours: the four daily steps keep it lit, and every node keeps growing toward mastery.",
    objective: "Journey complete — keep the path lit",
    action: { type: "loop", loop: "read" },
    xp: 300,
    check: () => false,
  },
];

export const CHAPTER_BY_ID: Readonly<Record<string, Chapter>> = Object.fromEntries(
  JOURNEY.map((c) => [c.id, c]),
);

/** The chapter that first introduces each loop (gates the Today strip). */
export const LOOP_INTRO_CHAPTER: Readonly<Record<LoopId, string>> = {
  read: "read1",
  review: "review1",
  write: "prep",
  explain: "aloud",
};
