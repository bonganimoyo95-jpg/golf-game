# Project 2 · Checkpoint 3

Release: Fairways & Friends Pocket Golf `v0.9.0`

## Goal

Correct the putting composition, improve swing feel, sell the cup result and reward pure contact without adding a 3D engine or destabilising the deterministic course model.

## Implemented

- Replaced the handedness-mirrored side-on putting model with a dedicated down-the-line camera.
- Locked the ball and physical cup to the lower and upper centre of the green view.
- Made the cup move deeper up-screen and scale down as remaining putt distance increases.
- Made right/left handedness change only the golfer's stance side and sprite mirror.
- Added rear three-quarter address and stroke poses for both selectable golfers.
- Kept aim honest: the cup remains fixed while the intended line pivots around the ball.
- Added perspective mowing stripes and depth bands to make the green read forward.
- Added a foreground cup lip and a 230 ms scale, drop and fade animation for holed putts.
- Replaced five independent swing delays with one 800 ms full-swing animation clock.
- Retimed impact and launch to 520 ms, with the fast portion of the downswing concentrated near impact.
- Added subtle interpolated position, rotation and scale motion while retaining the existing authored poses.
- Added a continuous contact-quality curve with a maximum three-percent full-swing carry bonus.
- Excluded the putter from the distance bonus so the suggested-power marker stays calibrated.
- Added pure-contact distance feedback to the HUD.
- Added lightweight pine, dogwood, water and bunker presentation detail while retaining the original playable geometry.

## Automated verification

- TypeScript typecheck passes.
- Production build passes.
- 61 tests pass across 14 files.
- New tests cover centred putting composition, handedness-independent targeting, distance depth, putt roll projection, contact-bonus taper and swing-timeline timing.
- Existing water, out-of-bounds, bunker, camera, replay and playable-hole tests remain green.

## Required Codespaces browser acceptance

Use `?qa=1` for direct scenarios where useful.

1. Start the 6-metre putt as the right-handed male golfer. Confirm the ball is near lower centre, the cup is directly ahead and the golfer stands to the left of the ball.
2. Repeat as a left-handed male golfer. Confirm only the golfer changes side; the cup and flag stay centred.
3. Repeat both handedness checks with the female golfer.
4. Adjust putt aim left and right. Confirm the cream line pivots and its orange endpoint moves while the physical black cup never moves.
5. Compare the 6-metre and 18-metre putt scenarios. Confirm the longer cup appears farther up-screen and slightly smaller.
6. Hole a controlled putt. Confirm the ball reaches the cup, moves behind the front lip, shrinks and disappears before the result screen.
7. Miss short and long. Confirm the ball remains visible at its actual stopped screen position and the next shot begins from its world position.
8. Play full swings with both golfers. Confirm the backswing is deliberate, transition and downswing accelerate naturally, launch occurs on the impact pose and the follow-through holds.
9. Pause during the backswing and during ball flight. Confirm both animation clocks freeze and resume together.
10. Stop the accuracy marker on or extremely near the white contact line. Confirm `PURE CONTACT` appears with a small distance bonus; verify the driver gain feels noticeable but not dominant.
11. Repeat a slightly imperfect shot. Confirm the bonus tapers instead of switching abruptly between full bonus and no bonus.
12. Recheck the tested water and greenside-bunker routes because perfect contact now changes maximum carry by up to three percent.

## Deliberately deferred

- Fully authored tee, fairway, approach and green background plates.
- Additional full-swing in-between artwork beyond the continuous timing and root-motion pass.
- Green slope and break simulation.
- Audio and haptic impact feedback.
