# Project 1 Checkpoint 8 — Gameplay QA correction

## Release

Version: `0.7.1`

This patch corrects player-facing defects found during the v0.7.0 architecture, asset and deterministic-play audit. It intentionally avoids a visual redesign or a new course.

## Corrections

- Ball screen travel is monotonic for either handedness, so the camera can catch up without pulling the ball backward.
- The landing view stays close to the resolved ball until the next-shot cut.
- Pausing freezes Phaser clock events and tweens together.
- Water and out-of-bounds resolutions no longer leave a stale flight ball at the invalid visual endpoint.
- The putting cup is a fixed target. Aim moves the line, not the hole.
- Missed-putt screen motion is projected from the calculated angular miss.
- Green aim is limited to a readable `±8°`.

## Verification

- TypeScript typecheck passes.
- Production build passes.
- `42` automated tests pass across `10` files.
- Every runtime PNG in the asset manifest was checked for presence, dimensions and valid image decoding during release preparation.
- Regression tests cover monotonic right/left camera travel, mirrored putting, fixed-cup aiming, shot-to-shot position continuity and an actual bunker landing.

## Required browser acceptance pass

The release still needs final hands-on play in the forwarded Codespaces browser before beginning v0.8.0:

1. Test all four golfer/handedness combinations.
2. Pause during backswing, downswing and ball flight; nothing should advance until resume.
3. Hit a normal full drive and watch the ball through rollout; it must never reverse on screen.
4. Confirm the next shot opens at the map position and lie where the prior shot resolved.
5. From the tee, aim `-15°` and hit a full, accurate driver to exercise the water drop.
6. From the tee, aim `+30°` and hit a full, accurate driver to exercise stroke-and-distance.
7. Reach the green, adjust putt aim left and right, and confirm the cup stays fixed while the line moves.
8. Compare suggested putt power against short, medium and long putts.

## Known structural debt for the next major phase

- The playable surface model and painted course are separate hand-authored representations; they can drift apart.
- One tee panorama is cropped and zoomed to impersonate every world position. It does not provide a true viewpoint from the ball.
- `GameScene` still owns gameplay state, UI, animation and camera orchestration in one large class.
- The title scene preloads all gameplay art, creating an avoidable mobile startup cost.
- There is no scene-level browser test, deterministic replay log or developer scenario menu.
- Golfer identity currently changes club distance and tee position; this should be replaced by an explicit tee/difficulty choice before wider release.
