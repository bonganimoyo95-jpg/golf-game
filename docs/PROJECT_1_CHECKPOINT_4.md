# Project 1 — Checkpoint 4

## Goal

Make putting readable on the first attempt by placing the camera behind the golfer and ball, keeping the cup visually centred and giving the player clearer information about direction and pace.

## Included

- [x] Over-the-shoulder camera aligned with the ball-to-cup line
- [x] Golfer shown from behind without blocking the putting path
- [x] Perspective green grid converging toward the cup
- [x] Centred cup and flag
- [x] Live aim line that visibly moves left and right
- [x] One-degree putting aim adjustments
- [x] On-screen remaining distance and recommended target power
- [x] Slower putting-meter timing
- [x] Wider capture tolerance for well-paced near-line putts
- [x] Hard putts still roll through and beyond the cup
- [x] Ball travel shown in perspective toward, beside or beyond the hole
- [x] Tested target-power calculations and cup-capture behavior

## Putting presentation

The camera recentres behind the ball after every putt. The cup remains directly ahead when the line is at zero degrees, including when the previous putt has rolled beyond the hole. The golfer is offset slightly to the left, creating an over-the-shoulder view that preserves a clear sightline from the ball to the cup.

The displayed target percentage is calculated from the same putter-distance formula used by the shot physics. It is guidance rather than an automatic result: the player must still stop the meter near that power and make accurate contact on the downswing.

## Tuning locations

- Camera geometry and grid: `src/game/scenes/GameScene.ts`
- Putting meter speed: `src/game/scenes/GameScene.ts`
- Recommended power and rollout curve: `src/game/physics/shotPhysics.ts`
- Cup radius and controlled overrun tolerance: `src/game/cupCapture.ts`

## Acceptance tests

- [ ] The golfer, ball and cup read as a behind-the-ball putting view.
- [ ] A zero-degree line points visually at the cup.
- [ ] Left and right inputs move the line in one-degree steps.
- [ ] The displayed target power changes with distance.
- [ ] A putt near the displayed power reaches the cup area.
- [ ] The rolling ball follows the visible direction in perspective.
- [ ] A well-paced near-line putt is captured.
- [ ] A substantially overpowered putt runs beyond the cup.
- [ ] The camera correctly recentres for the next putt.
- [ ] Keyboard and touch controls remain usable throughout the hole.

## Next checkpoint

Replace the remaining geometric placeholders with a cohesive original pixel-art package for the golfer, course, hazards, putting green, swing poses and interface.
