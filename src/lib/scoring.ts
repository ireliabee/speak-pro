/**
 * The writing rubric. Pure: text + framework id -> score and the checks behind it.
 */
export interface RubricCheck {
  ok: boolean;
  txt: string;
}

export interface ScoreResult {
  /** 0..100 */
  score: number;
  checks: RubricCheck[];
  /** number of "very long" (12+ letter) words */
  longw: number;
}

const LONG_WORD_LETTERS = 12;

export function scoreText(txt: string, fw: string): ScoreResult {
  const t = txt.trim();
  const sents = t.split(/[.!?]+\s|\n/).filter((s) => s.trim().length > 3);
  const words = t.split(/\s+/).filter(Boolean);
  const low = t.toLowerCase();
  const has = (re: RegExp) => re.test(low);

  const checks: RubricCheck[] = [];
  checks.push({ ok: sents.length >= 4, txt: `At least 4 sentences (${sents.length})` });
  checks.push({
    ok: words.length >= 60 && words.length <= 220,
    txt: `60–220 words (${words.length})`,
  });
  checks.push({
    ok: has(/\b(because|since|therefore|so that|as a result|which means)\b/),
    txt: "Gives a reason (because / therefore…)",
  });
  checks.push({
    ok: has(/\b(for example|for instance|e\.g\.|such as|when i|last week|in 20\d\d|consider)\b/),
    txt: "Contains a concrete example",
  });

  const first = new Set((sents[0] ?? "").toLowerCase().match(/\b[a-z]{5,}\b/g) ?? []);
  const last = (sents[sents.length - 1] ?? "").toLowerCase().match(/\b[a-z]{5,}\b/g) ?? [];
  const overlap = last.filter((w) => first.has(w)).length;
  checks.push({
    ok: overlap >= 1,
    txt:
      fw === "jiovanna" ? "Answer resolves the opening situation" : "Closes by restating the point",
  });

  const longw = words.filter((w) => w.replace(/[^a-z]/gi, "").length >= LONG_WORD_LETTERS).length;
  checks.push({
    ok: longw / Math.max(words.length, 1) < 0.06,
    txt: `Orwell check: few very long words (${longw})`,
  });

  if (fw === "jiovanna") {
    checks.push({
      ok: has(/\b(but|however|until|then|suddenly|yet)\b/),
      txt: "Has a complication (but / however / until…)",
    });
  }
  if (fw === "kayceon") {
    checks.push({
      ok: has(/once upon|every day|until one day|because of that|until finally/),
      txt: "Uses the story-spine beats",
    });
  }
  if (fw === "breann") {
    checks.push({
      ok: has(/\b(i feel|i need|would you|could you)\b/),
      txt: "Names a feeling, a need and a request",
    });
  }

  const ok = checks.filter((c) => c.ok).length;
  return { score: Math.round((ok / checks.length) * 100), checks, longw };
}

/** Minimum score to submit a paragraph. */
export const SUBMIT_THRESHOLD = 40;
/** Score that earns a bonus rep on the framework node. */
export const EXCELLENT_THRESHOLD = 85;
/** Score (with zero long words) that satisfies Orwell's rule. */
export const ORWELL_THRESHOLD = 80;
