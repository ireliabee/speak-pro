# Changelog

All notable changes to SpeakPro are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-11-01

First tracer bullet.

### Added

- Skill map ported from the prototype: 64 nodes with original coordinates, hubs, dotted/arc
  edges and the 16-node critical path; D3 zoom/pan, fog of war, NEXT beacon, node states
  (locked / discovered / practising / mastered) and growth with reps.
- 19-chapter journey with pure, idempotent chapter checks; quest panel with lesson, objective,
  progress meter, route dots and a single call-to-action.
- Four daily loops as modals: Read & log (5 words → cards), Write (rubric scoring, submit at
  40+), Explain aloud (2-minute timer + Feynman checks), Review (Leitner deck with flip cards).
- Leitner spaced repetition (boxes 1–5, intervals 1/3/7/14/30 days).
- XP, six levels, daily streak with lit/cold path, discipline packs with glossary seeds.
- Onboarding, tutorial cards, celebration on chapter completion, snapshot card, reset.
- Zustand store persisted to `localStorage["speakpro.v1"]`.
- Vitest unit/component suite (70% coverage threshold), Playwright e2e, GitHub Actions CI.
