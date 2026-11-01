import type { DisciplineId } from "./graph";

export interface DisciplinePack {
  name: string;
  /** Seed words: [word, sentence it lived in]. */
  words: ReadonlyArray<readonly [string, string]>;
}

export const DISCIPLINES: Readonly<Record<DisciplineId, DisciplinePack>> = {
  zatanna: {
    name: "Medicine",
    words: [
      ["prognosis", "The prognosis improved after the second course of treatment."],
      ["idiopathic", "The condition was labelled idiopathic because no cause was found."],
      ["etiology", "The etiology of the outbreak remained unclear for weeks."],
    ],
  },
  caterina: {
    name: "Law",
    words: [
      ["estoppel", "Estoppel barred him from denying what he had earlier asserted."],
      ["tort", "A tort is a civil wrong that causes harm."],
      ["precedent", "The court followed precedent set a decade earlier."],
    ],
  },
  karolyn: {
    name: "Science",
    words: [
      ["falsifiable", "A good hypothesis must be falsifiable."],
      ["stochastic", "The process is stochastic, not deterministic."],
      ["heuristic", "They used a heuristic to narrow the search space."],
    ],
  },
  adiel: {
    name: "Philosophy",
    words: [
      ["epistemic", "Her objection was epistemic, not moral."],
      ["a priori", "The claim is known a priori, before experience."],
      ["teleology", "Aristotle’s teleology explains things by their purpose."],
    ],
  },
  averi: {
    name: "Business",
    words: [
      ["mitigate", "We can mitigate the risk by diversifying suppliers."],
      ["leverage", "They used leverage to expand quickly."],
      ["attrition", "Customer attrition fell after the redesign."],
    ],
  },
  berlin: {
    name: "Engineering",
    words: [
      ["idempotent", "The endpoint is idempotent, so retries are safe."],
      ["fault-tolerant", "A fault-tolerant system degrades gracefully."],
      ["latency", "Latency dropped once the cache was warm."],
    ],
  },
};

export const DISCIPLINE_IDS = Object.keys(DISCIPLINES) as DisciplineId[];

export function isDisciplineId(id: string | null | undefined): id is DisciplineId {
  return !!id && id in DISCIPLINES;
}
