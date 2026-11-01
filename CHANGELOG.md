# Changelog

All notable changes to SpeakPro are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — motion design system (DESIGN.md)

- Spring camera hook `useCamera` (fly-to, push-in/pull-back, idle drift, drag inertia).
- Parallax starfield, vignette and a lantern glow that follows the beacon.
- Standard reward sequence on every completed step: dim → wipe → lightning edge draw with
  spark → particles → XP roll → celebration spring-in; level-up light sweep.
- Four-slot ritual bar with keyboard shortcuts 1–4 and self-drawing done checks.
- Four fixed Web Audio reward tones (C5/E5/G5/C6) and the all-four chord, behind a toggle.
- Path states lit / at-risk (flicker) / cold; cold-open cool-down then first-slot relight.
- Review cards deal in and slide off by rating; writing score counts up, checks tick/shake;
  explain timer pulses amber in the last 15 s and rings the SPEAK tone at zero.
- `prefers-reduced-motion` handling; `data-*` state attributes for tests.

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
