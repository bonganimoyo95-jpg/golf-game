# Project 1 — Checkpoint 2

## Goal

Replace the scripted shot preview with a deterministic, editable physics sandbox that produces visibly different outcomes from club, power, accuracy, aim, wind, starting lie and landing surface.

## Included

- [x] Club-specific carry, loft, peak height, flight time and rollout configuration
- [x] Power-based distance calculation
- [x] Timing-based directional error
- [x] One-pass 3/4-circle power-and-accuracy meter
- [x] Power-dependent downswing speed
- [x] Automatic maximum-power reversal and late-contact miss
- [x] Aim-angle calculation
- [x] Wind drift
- [x] Tee, fairway, rough and bunker lie modifiers
- [x] Airborne arc, landing, bounce and rollout animation
- [x] Ball position retained between shots
- [x] Distance remaining to the pin
- [x] Fairway, rough, bunker, green, water and out-of-bounds detection
- [x] Water and out-of-bounds penalty handling
- [x] Automatic putter selection on the green
- [x] Determinism and behavior tests

## Tuning locations

- Club behavior: `src/game/data.ts`
- Lie modifiers: `src/game/data.ts`
- Course geometry and surfaces: `src/game/courseModel.ts`
- Shot formulas and trajectory sampling: `src/game/physics/shotPhysics.ts`
- Swing timing, speed and contact window: `src/game/swingMeter.ts`

## Acceptance tests

- [ ] Driver, iron and wedge produce visibly different distances and arcs in the browser.
- [ ] Early and late accuracy inputs send the ball to opposite sides of the target line.
- [ ] Lower power produces a shorter shot.
- [ ] The ball remains at its stopped position for the following shot.
- [ ] Distance to the pin updates after each valid shot.
- [ ] Rough and bunker lies reduce distance.
- [ ] Water or out-of-bounds adds one penalty stroke and returns the ball.
- [ ] Touch and keyboard can complete several consecutive shots without an input lock.
- [ ] Power locks without the marker jumping or resetting.
- [ ] The downswing becomes visibly faster at higher selected power.
- [ ] The marker cannot loop to offer another power or accuracy attempt.

## Next checkpoint

Add dedicated putting behavior, cup capture, hole completion and score-to-par results, turning the physics sandbox into a completable par-4 hole.
