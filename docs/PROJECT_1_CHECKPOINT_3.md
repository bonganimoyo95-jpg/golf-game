# Project 1 — Checkpoint 3

## Goal

Turn the shot-physics sandbox into one complete round-trip: play from the tee, reach the green, putt into the cup, review the score and replay or return to the title screen.

## Included

- [x] Automatic putter selection on the green
- [x] Gridded putting view with a visible cup and flag
- [x] Slower putting-meter timing and fine low-power control
- [x] Line-based cup capture using aim, stopping distance and overrun pace
- [x] Successful putts finish at the pin
- [x] Missed or overpowered putts remain playable from their new position
- [x] The putting line automatically faces the cup, including after rolling beyond it
- [x] Hole-complete transition
- [x] Total-strokes and score-to-par result screen
- [x] Play-again and return-to-title actions
- [x] Cup-capture, putting-physics and scoring tests

## Cup behavior

The cup is evaluated against the complete path of a putt rather than only its final point. A putt is holed when its path passes within the capture radius and it has no more than a small amount of speed represented by remaining overrun distance. This lets a well-paced putt drop while a hard putt crosses the cup and continues.

## Tuning locations

- Putter distance curve: `src/game/physics/shotPhysics.ts`
- Cup radius and maximum overrun: `src/game/cupCapture.ts`
- Putting-meter speed: `src/game/scenes/GameScene.ts`
- Result labels: `src/game/scoring.ts`
- Green and pin geometry: `src/game/courseModel.ts`

## Acceptance tests

- [ ] Reaching the green automatically selects the putter and shows the putting grid.
- [ ] A low-power putt travels only a short distance.
- [ ] Aim changes the direction of a putt.
- [ ] A controlled putt crossing the cup is captured.
- [ ] A hard putt crossing the cup runs past it.
- [ ] A missed putt leaves the ball at its new location for another stroke.
- [ ] A made putt opens the result screen and reports the correct total strokes.
- [ ] The result screen reports the correct score relative to par.
- [ ] Play Again starts a fresh hole and Title Screen returns to the title.
- [ ] Touch and keyboard can both complete a putt without an input lock.

## Next checkpoint

Replace the current geometric placeholder art with a cohesive original pixel-art presentation, including the golfer, course terrain, hazards, putting green, swing poses and interface details.
