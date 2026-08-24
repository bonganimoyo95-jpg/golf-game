# Project 2 Checkpoint 1 — Course, camera and QA architecture

## Release

Version: `0.8.0`

This release rebuilds the course presentation and test seams before final visual, animation and audio polish. It is intentionally focused on trustworthy gameplay state and repeatable diagnosis.

## What changed

### One course, one truth

- `src/game/courseDefinition.ts` owns course bounds, tees, pin, fairway shape, water, green and bunker geometry.
- `getLieAt`, water-entry detection, the overhead map and the lower course view consume that definition.
- Bunkers are rendered after the green and classified before the green, preserving visible/playable priority.
- The old overhead PNG remains in the asset folder for historical reference but is no longer a runtime gameplay dependency.

### Position-aware 2.5D camera

- The lower view projects world positions relative to a camera at the current ball.
- Setup views face the selected shot line; approach and putting setup face the pin.
- During flight, the camera advances along the calculated world trajectory and remains behind the ball.
- Landing resolves to a deliberate view from the landed or dropped position, never the tee panorama.
- Fairway, green, bunkers and water in the lower view are projected from their actual course coordinates.

### Fair player setup

- Golfer appearance, handedness and tee choice are separate controls.
- Male and female golfers now use the same club definitions.
- Older v0.7 profiles migrate once to their former default tee, while every newly saved profile has an explicit tee choice.

### QA and replay tools

- Start with `?qa=1` to expose the QA Lab on the title screen.
- Scenarios cover tee, fairway, rough, bunker, short putt, long putt, water drop and out-of-bounds.
- Water and out-of-bounds scenarios include deterministic club and aim instructions.
- Every shot records its full deterministic input and resolved outcome.
- QA pause includes **Copy Replay**; the latest replay is also stored locally under `fairways-friends-last-replay-v1`.

### Startup and presentation

- Boot loads the cover only. Gameplay art loads after Play or QA Lab is selected.
- The public-facing checkpoint labels were replaced with game copy.
- Desktop layout is capped at the native `352 × 440` size instead of stretching to 440 CSS pixels.

## Automated verification

- TypeScript typecheck passes.
- Production build passes.
- `52` automated tests pass across `12` files.
- Tests cover surface-definition classification, map projection bounds, perspective scale, monotonic chase-camera travel, shared physical view for either handedness, independent tee selection, equal club performance, QA hazard probes and deterministic replay reproduction.

## Required hands-on Codespaces pass

Automated checks cannot judge animation feel, perceived depth or touch ergonomics. Run this pass in the forwarded browser before calling v0.8.0 final:

1. Confirm the cover loads before gameplay art and Play transitions through the short course-loading screen.
2. Test male/female, right/left-handed and back/forward tee combinations. The selected buttons must stay visibly highlighted.
3. Watch a full driver swing for pose popping, abrupt timing or a disappearing follow-through.
4. Complete a tee shot. Driver must be unavailable on the next fairway, rough or bunker shot.
5. Confirm the next setup is visibly based at the map marker where the previous ball resolved.
6. During a full shot, verify the lower fairway and hazards move consistently while the camera follows forward; the landing view must not resemble a cut back to the tee.
7. Open `?qa=1`, run **Water Drop**, follow the displayed full-iron instruction and confirm the resolved map marker sits just outside the water near entry.
8. Run **Bunker** and confirm the HUD says bunker, the lower foreground shows sand, and only iron/wedge are available.
9. Run both putting scenarios for each handedness. The golfer must face the cup, the flag must remain fixed, and aim must move the line rather than the hole.
10. Compare the 6 m and 18 m suggested-power markers. Record whether each feels short, fair or generous.
11. Pause during backswing and flight. Timers, camera, ball and animation must all remain frozen.
12. In QA pause, use **Copy Replay** after a shot and confirm JSON is placed on the clipboard.

## Known limits after this checkpoint

- The 2.5D course uses functional vector projection and atmosphere, not final authored perspective plates or terrain sprites.
- `GameScene` still coordinates state, HUD, animation and rules in one large class and should be split before adding multiple holes.
- The Phaser runtime remains the dominant JavaScript bundle despite deferred image loading.
- Swing pose timing is deterministic but still frame-swapped rather than tweened skeletal or high-frame sprite animation.
- Putting guidance remains a mathematically exact beginner guide and still needs subjective feel tuning.
- Audio, richer impact feedback, particles, lie-specific animation and additional holes remain deferred.
