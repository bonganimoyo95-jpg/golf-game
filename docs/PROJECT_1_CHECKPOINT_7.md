# Project 1 — Checkpoint 7

## Goal

Make every shot read as one continuous trip down a single golf hole: the golfer starts from the ball's real position, the camera follows the flight forward, and the next view begins where the ball finishes.

## Character and cover art

- [x] Male golfer rebuilt from the man in the supplied Fairways & Friends photo
- [x] Female golfer rebuilt from the woman in the supplied Fairways & Friends photo
- [x] Twelve transparent, consistently scaled poses for each golfer
- [x] Approved Fairways & Friends Pocket Golf illustration used as the title cover
- [x] Male/female and right/left-handed selection retained

## Course and camera

- [x] Tee panorama and aerial map depict the same fairway, lakes and bunkers
- [x] Aerial map keeps the correct wide aspect ratio
- [x] Current world ball position controls the setup-camera crop and zoom
- [x] Flight camera advances with the ball instead of leaving the golfer at the tee
- [x] Landing camera closes in on the final lie without pulling the ball backward
- [x] Next setup view begins at the resolved ball or penalty-drop position
- [x] Golfer fades from frame only after the camera has begun following the shot

## Flight and putting

- [x] Club-sensitive, asymmetric launch arc with a readable apex and descent
- [x] Diminishing bounce followed by rollout
- [x] Overhead marker follows the same sampled world trajectory
- [x] Putting golfer, ball, line, cup and flag share one visible direction of play
- [x] Remaining putt distance produces an exact suggested-power percentage
- [x] Suggested power is also marked on the swing meter

## Club rules

- [x] Driver available only on the tee
- [x] Iron and wedge available from fairway and rough
- [x] Iron and wedge available from sand, with existing lie penalties
- [x] Putter forced only on the green

## Verification

- TypeScript typecheck: passed
- Automated tests: 36 passed across 9 files
- Production Vite build: passed

## Deferred

Audio, additional holes, shot shaping, elevation and final effects polish remain separate later checkpoints.
