# SpeakPro — Motion & Visual Design Spec

Goal: a map you want to return to, where every return rehearses the same four gestures
(READ → WRITE → SPEAK → REVIEW) until they are muscle memory. Motion is never decorative:
every effect encodes state, reward, or direction.

## 1. Visual language

- **Dark observatory**: near-black navy base (#0b0f17), a slow radial "lantern" glow that
  follows the current chapter node (CSS radial-gradient, position lerped to the beacon).
- **Depth**: three parallax layers in the SVG — far starfield dots (drift 0.2×), edge layer (1×),
  node layer (1×) + a soft vignette. Pan/zoom moves the starfield slower than the graph.
- **Light as progress**: locked nodes are matte charcoal; discovered = rim-lit; practising =
  filled; mastered = filled + bloom (feGaussianBlur glow filter) + slow halo rotation.
- **Colour roles** (unchanged): teal core, green structure, blue vocabulary/clarity,
  purple persuasion/resources, orange = _you / the path / reward_. Orange appears ONLY for
  the player's route and rewards, so the eye learns "orange = mine".
- **Type**: Fraunces (display) for chapter titles and numbers, Inter for UI. Big numerals.

## 2. Camera (the signature move)

Implement a single `useCamera()` with spring physics (stiffness 120, damping 20):

- **Fly-to** on chapter advance: zoom out 15% → arc to target → settle in (600–900 ms).
  Always the same shape so the body anticipates where "next" will appear.
- **Push-in** when a loop modal opens (scale 1.06 toward the active node, blur the map 6 px).
- **Pull-back** on modal close, then the reward sequence plays.
- **Idle drift**: after 8 s of no input, the camera breathes ±1% scale over 6 s.
- Wheel-zoom anchored to cursor; drag inertia with friction 0.92.

## 3. Lighting & reward sequence (every completed step — identical every time)

1. Map dims 25% (200 ms).
2. Active node: radial fill wipe (0→r, 350 ms, ease-out-back) + white flash 120 ms.
3. Lightning arc: the orange edge from the previous path node draws itself (stroke-dashoffset,
   450 ms) with a 2-px bright core + 10-px blurred halo; a spark particle rides it (animateMotion).
4. 18–24 particles burst (WAAPI), colour = node colour; haptic `navigator.vibrate(12)` on mobile.
5. XP counter rolls (tween) in the top bar; level bar fills; if level-up: full-width light sweep.
6. Map relights; camera pulls back; celebration card springs in (scale .92→1, 400 ms).
   Audio (optional, user-toggle, default on): four short tones, one per loop type, same note every
   time — READ (C5), WRITE (E5), SPEAK (G5), REVIEW (C6). Completing all four in a day plays the
   chord. These tones ARE the muscle-memory hook; never change them.

## 4. Daily ritual (the thing that builds the habit)

- The bottom strip is a fixed **four-slot ritual bar**, always in the same order, same place.
  Each slot is a tactile key: hover lifts 3 px, press depresses 1 px, done = filled with its
  tone's colour and a check that draws itself. Keyboard shortcuts **1 2 3 4** open the four
  loops; the keys are printed on the slots so hands learn them.
- Each loop modal opens with the same choreography (push-in → card up → first field focused),
  and closes with the same reward sequence. Identical every day.
- Streak as light: path edges are _lit_ (bright + flowing sparks) while the streak is alive;
  at risk (last action >20 h ago) they flicker gently; cold = dim amber, no flow. On opening a
  cold map: 2.5 s cool-down animation, then the beacon re-lights the first slot.

## 5. Micro-interactions

- Node hover: scale 1.12 spring, neighbours brighten, others fade to 15%, cursor becomes a
  small orange ring.
- Collapsed "+" nodes: on expand, children orbit out radially with 60 ms stagger and a slight
  overshoot; dashed connector draws.
- Labels: cross-fade on mode toggle; label follows node growth.
- Quest panel: content slides from the right 16 px + fade (320 ms); objective progress bar
  tweens; the one button has a subtle shimmer every 6 s when idle (the only "call to action"
  animation on screen).
- Writing score: number counts up from 0; ✓ items tick in with 50 ms stagger; ✗ items shake
  once.
- Explain timer: ring drains, last 15 s pulses amber, 0 s rings the SPEAK tone.
- Review cards: 3D flip (500 ms), rating buttons slide the card off in the chosen direction
  (Again = left, Easy = right) and the next card deals in from the deck.
- Reduced motion: honour `prefers-reduced-motion` — crossfades only, no camera flights,
  no particles; tones stay (they are the habit cue).

## 6. Performance & reliability

- SVG up to ~300 nodes; all transforms via CSS/WAAPI, no React re-render per frame.
- Camera and particles in refs/rAF; state updates only on completion events.
- Persist state in Zustand/localStorage; idempotent chapter checks; never lose a completed step.
- All animations testable: expose `data-state` attributes (locked/…/mastered, beacon, lit/cold)
  so Playwright asserts outcomes without timing on animations.
