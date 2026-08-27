# Project 2 Checkpoint 4 — v0.10 browser acceptance

This pass verifies the Azalea Bend production-polish release at the native 352 × 440 presentation. Run it in Codespaces after `npm test` and `npm run build` both pass.

## Standard round

1. Confirm the hole introduction reads **Azalea Bend**, **Par 5**, and **476 m**.
2. Confirm the overhead map reads as a left-bending fairway rather than a straight corridor.
3. Confirm the narrow creek follows the inside of the bend and crosses the approach immediately short of the green.
4. Confirm the lower view contains dark pine framing, bright turf, pale rear bunkers and restrained pink azalea colour.
5. Cycle clubs from the tee: **Driver → 3W → Iron → Wedge**.
6. Hit a driver, then confirm the driver disappears and the fairway list begins with **3W**.
7. Confirm the second shot begins from the first ball's resolved position and the camera never returns toward the tee.
8. Confirm pure full-swing contact still awards no more than the displayed 3% carry bonus.

## Putting comparison

Open `?qa=1`, then compare **Putt 6 M** and **Putt 18 M**.

1. The ball and cup must remain on one centred forward axis for both handedness options.
2. The golfer must stand beside the line; handedness may move the golfer but never the cup.
3. Both feet should recede along a line parallel to the ball-to-cup line, with the farther foot slightly higher in the frame.
4. The 6 m scenario should display **FORGIVING** and a visibly wider green contact window.
5. The 18 m scenario should display **PRECISION**, a narrower contact window and a slightly quicker return.
6. The white suggested-power band should be wider at 6 m and narrower at 18 m.
7. A holed putt must shrink behind the cup lip and disappear before the result screen.

## Hazard and club checks

1. **Water Drop:** use the preset full wedge at 0°; confirm entry-point drop and one-stroke penalty.
2. **Out of Bounds:** use the preset full 3-wood at +30°; confirm stroke-and-distance.
3. **Bunker:** confirm only Iron and Wedge are available.
4. **Rough:** confirm 3W remains available but receives the rough distance penalty.

## Feel and lifecycle

1. Confirm the meter's slimmer rail and marker remain readable without covering the golfer.
2. Confirm the backswing pauses briefly at the top and accelerates through impact without freezing.
3. With browser audio enabled, confirm restrained swing, impact, landing and cup sounds begin only after interaction.
4. Pause during the backswing and during ball flight; resume and complete both sequences.
5. Pause → Restart Hole → swing again.
6. Pause → Exit to Title → begin another round → swing again.

If a visual or timing issue remains, capture one continuous clip beginning before the input and ending after the state transition. Include golfer, handedness, tee, club, displayed power and contact result.
