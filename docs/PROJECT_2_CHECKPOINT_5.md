# Project 2 Checkpoint 5 — v0.11 browser acceptance

This pass verifies club scaling, shot planning and recovery play at the native 352 × 440 presentation. Run it in Codespaces after typecheck, tests and production build all pass.

## Club and distance display

1. From the tee, cycle through Driver, 3W, Iron and Wedge.
2. Confirm the rated carry values read **250 m**, **220 m**, **165 m** and **95 m** on a clean tee lie.
3. Confirm the header always labels remaining distance as **PIN … M**.
4. Confirm the selected club panel separately identifies rated **CARRY** and **TOTAL** distance.
5. Confirm rough and bunker lies reduce the displayed carry instead of continuing to promise the clean-lie rating.

## PLAY and FULL guidance

1. Confirm the overhead map shows a cream **PLAY** target and an orange **FULL** target.
2. Confirm the lower course view shows the matching cream circle and orange cross.
3. Change clubs and verify both targets move immediately.
4. Confirm the white meter guide matches the displayed PLAY power.
5. Confirm the recommendation names a legal club and power for the current lie.
6. On a shot too long for the selected club, confirm the guide reads full power rather than inventing extra distance.

## Recovery from beyond the green

1. Use the **Bunker** QA scenario and confirm the flag is visibly in front of the golfer.
2. Hit beyond the green into the rear recovery apron, if necessary by aiming away from the pin.
3. Confirm the next camera turns back toward the cup; it must not continue aiming farther away from the hole.
4. Confirm the PIN distance, recommendation, PLAY target and FULL target all describe that reverse-direction recovery.
5. Confirm a playable ball behind the green is not called out of bounds solely because its world Y position exceeds the pin.

## Penalty clarity

1. In **Water Drop**, use the preset full wedge at 0° to the pin.
2. Confirm a pre-shot warning appears before swinging.
3. Confirm the post-shot banner reads **WATER**, **+1** and **DROP AT ENTRY**.
4. In **Out of Bounds**, use the preset full 3W at -30° from the pin.
5. Confirm the banner reads **OUT OF BOUNDS**, **+1** and **PREVIOUS SPOT**.

## Regression checks

1. Complete a normal drive, planned 3-wood and putt route.
2. Confirm pure contact can still add up to 3% beyond the rated planning target.
3. Confirm putting retains its distance-scaled difficulty and cup-sink animation.
4. Pause during a swing and ball flight, then repeat Pause → Restart and Pause → Exit to Title.

If anything is unclear, record one continuous clip beginning before club selection and ending after the next-shot setup. Keep the PIN distance, club panel, target markers and meter visible.
