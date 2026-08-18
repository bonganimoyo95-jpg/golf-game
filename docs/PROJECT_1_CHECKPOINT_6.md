# Project 1 — Checkpoint 6

## Goal

Correct the character, camera, shot-meter, terrain and penalty systems identified during hands-on playtesting of v0.5.0.

## Character and player setup

- [x] White-shirt original male golfer
- [x] Original blonde female tour-golfer-inspired character with no real-person likeness or sponsor marks
- [x] Male/female choice before the hole
- [x] Right/left-handed choice before the hole
- [x] Mirrored golfer, meter and screen-flight direction for left-handed play
- [x] Female full-swing clubs set to 88% of the corresponding male distance
- [x] Female golfer starts from a front tee 42 metres closer to the pin
- [x] Slower swing frame timing and smoother transition into impact
- [x] Follow-through held throughout ordinary ball flight and shot results
- [x] Celebration reserved for birdie or better

## Putting and camera

- [x] Side-on putting address that faces the cup
- [x] Cup placed in the visible direction of play
- [x] Same course horizon and scenery on the green as on full shots
- [x] Green foreground, cup, flag and adjustable line rendered in the normal play view
- [x] Camera presentation recentres on the ball's new lie after each shot
- [x] Screen ball flight moves in the player's visible direction of play
- [x] Overhead marker continues to follow the actual world trajectory

## Shot meter

- [x] Meter placed right of a right-handed golfer and left of a left-handed golfer
- [x] Meter no longer overlaps either character
- [x] Layered border, clean colour bands, power ticks, locked-power marker and contact marker
- [x] Slower return timing while preserving the one-pass power/contact rule

## Lies and rules

- [x] Persistent high-contrast lie badge
- [x] Bunker zones aligned to the illustrated greenside sand
- [x] Bunker classification evaluated before green classification
- [x] Putter forced only on the green
- [x] Driver unavailable from a bunker
- [x] Water penalty resolves at a safe point immediately before entry
- [x] Out-of-bounds remains stroke-and-distance from the previous spot

## Verification

- TypeScript typecheck: passed
- Automated tests: 29 passed
- Production Vite build: passed

## Deferred

Audio, additional holes, advanced shot shaping and final art/effects polish remain separate later checkpoints.
