# SpeakPro — by iReliabee

A guided elite-communication trainer. The whole framework (structure + vocabulary, the nine
delivery frameworks, the daily READ → WRITE → SPEAK → REVIEW stack) is drawn as a skill map;
a 19-chapter journey walks you along one orange route, one framework and one objective at a
time. Finish the objective and the node lights up, the next one appears.

This is the first tracer bullet: the full journey, all four loops, Leitner spaced repetition,
the writing rubric, XP/levels, streaks and local persistence — end to end.

## Stack

- Next.js 15 (app router) · React 19 · TypeScript strict
- Tailwind CSS 4 (design tokens in `src/app/globals.css`)
- Zustand 5 with `persist` → `localStorage["speakpro.v1"]`
- D3 (`d3-zoom`, `d3-selection`) for the map camera; SVG rendered by React
- Framer Motion for panels, modals and toasts
- Vitest + Testing Library + jsdom · Playwright · ESLint · Prettier
- Node 22, npm

## Scripts

| Script               | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Dev server on <http://localhost:3000>                 |
| `npm run build`      | Production build                                      |
| `npm start`          | Serve the production build                            |
| `npm run typecheck`  | `tsc --noEmit`                                        |
| `npm run lint`       | ESLint (next/core-web-vitals + typescript + prettier) |
| `npm run format`     | Prettier write                                        |
| `npm test`           | Vitest with coverage (70% threshold)                  |
| `npm run test:watch` | Vitest in watch mode                                  |
| `npm run test:e2e`   | Playwright (boots `npm run dev` itself)               |

## Architecture

```
src/
  data/        pure, typed content — the spec lives here
    graph.ts       nodes (same coordinates as the prototype), hubs, edges, critical PATH
    journey.ts     the 19 chapters; each `check(state)` is a pure predicate
    disciplines.ts six discipline packs with glossary seeds
    loops.ts       the four daily loops and which nodes they grow
    levels.ts      XP thresholds
  lib/         pure functions, no React
    scoring.ts     scoreText(text, frameworkId) — the writing rubric
    srs.ts         Leitner schedule: boxes, intervals, rateCard, buildDeck
    journey.ts     chapterIndex, revealed, levelOf, stateOf, masteryPct, questProgress
    dates.ts       ISO days, streak warmth
  store/
    state.ts       the persisted state shape + defaults()
    useAppStore.ts Zustand store (persist key "speakpro.v1") and all actions
    useUiStore.ts  non-persisted UI state: modal, focus, toasts, map commands
  components/
    App.tsx            wires everything; owns the chapter-advance choreography
    map/SkillMap.tsx   SVG map: D3 zoom/pan, fog, beacon, node states, bursts
    quest/QuestPanel   the one chapter you are on; NodePanel for node detail
    loops/*            Read / Write / Explain / Review modals
    Celebration, Onboarding, TodayStrip, TopBar, Tutorial, Snapshot, ui/*
  app/         Next.js app router: layout (self-hosted Inter + Fraunces), page, globals.css
e2e/           Playwright specs
```

Design rules:

- **Data and logic are pure.** `src/data` and `src/lib` never import React. Chapter checks
  run over plain state, so they are trivially testable and idempotent.
- **One store, one persisted shape.** `useAppStore` holds the state from the prototype's
  `defaults()`; actions return what happened (`LoopResult`) so the UI can choreograph effects.
- **Effects are commands, not state.** Bursts, edge draws and camera moves are sent through
  `useUiStore.send()` and consumed imperatively by `SkillMap` (Web Animations API + rAF), so
  nothing re-renders per frame.
- **Testable outcomes.** Nodes expose `data-node-id`, `data-state`, `data-beacon`, `data-fog`;
  the HUD exposes `data-state="lit|cold"`. Tests assert state, never animation timing.

### Motion system

`DESIGN.md` is the motion & visual spec; the implementation lives mostly outside React render:

- `src/components/map/useCamera.ts` — one spring camera (stiffness 120, damping 20) driven by
  rAF on refs: `flyTo` (zoom out 15% → arc → settle), `pushIn`/`pullBack` around modals,
  idle drift after 8 s, drag inertia (friction 0.92). d3-zoom only feeds gestures into it.
- `SkillMap` layers: parallax starfield (0.2×), lantern glow lerped to the beacon, edges with
  `lit` / `at-risk` / `cold` states, bloom + halo rotation on mastered nodes.
- The standard reward sequence (`reward` command): dim → radial wipe + flash → lightning arc
  with spark → particles (+ haptic) → relight; XP rolls in the top bar; level-ups sweep light.
- `RitualBar` — four fixed slots, keys **1 2 3 4** printed and bound, done-check draws itself.
- `src/lib/audio.ts` — four fixed Web Audio tones (C5/E5/G5/C6) behind the 🔔 toggle; the
  chord plays when all four steps are done in a day.
- `prefers-reduced-motion` → no camera flights, particles or shimmer; crossfades only; tones stay.
- Outcomes are exposed as `data-*` attributes (`data-path`, `data-state`, `data-beacon`,
  `data-pushed`, `data-reduced-motion`) so tests never time animations.

Fonts are self-hosted (`src/app/fonts`, Fontsource builds of Inter and Fraunces, OFL) via
`next/font/local`, so builds don't depend on Google Fonts being reachable.

## Testing

```
npm test            # unit + component, with coverage
npm run test:e2e    # Playwright, chromium; starts the dev server for you
```

Unit tests cover the rubric, the Leitner schedule, journey helpers and every store action.
Component tests cover the quest panel, each loop modal, the map (all nodes render, beacon on
the current target), onboarding, celebration and the app-level flow. The e2e spec walks
onboarding → chapter 1 → choose discipline → read loop → celebration and checks persistence
across a reload.

Playwright expects a Chromium matching `@playwright/test@1.63.0`. If browsers are not
installed, run `npx playwright install chromium` once (the CI workflow does this with
`--with-deps`).

## CI

`.github/workflows/ci.yml` runs lint, typecheck, Vitest with coverage, the production build,
and Playwright on every push and pull request.
