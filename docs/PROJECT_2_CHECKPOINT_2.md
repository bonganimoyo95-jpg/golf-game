# Project 2 Checkpoint 2 — Swing lifecycle correction

## Release

Version: `0.8.1`

The browser recording showed the golfer freezing on the first backswing frame while the swing meter and buttons remained responsive. The defect occurred after navigating from a paused `GameScene`.

## Root cause

Phaser reuses a scene's Clock when the scene is restarted or started again. The Clock's shutdown/start lifecycle clears timer events but does not reset its `paused` property. Restarting the hole or leaving gameplay directly from the pause menu therefore allowed `time.paused = true` to survive into the next round.

The swing meter continued because it advances from the scene's frame delta. Golfer poses and ball launch did not continue because those actions use delayed Clock events.

## Correction

- Fresh gameplay explicitly restores the Clock and TweenManager before scheduling any events.
- Restart, QA navigation and exit-to-title restore motion before changing scenes.
- Scene shutdown also clears a lingering paused state.
- Reset and keyboard restart use the same safe restart path.
- Replay logs now identify v0.8.1 while remaining compatible with v0.8.0 logs.

## Verification

- TypeScript typecheck passes.
- Production build passes.
- 53 tests pass across 13 files.
- A regression test verifies that scene motion restoration clears the paused Clock and resumes tweens.

## Immediate browser retest

1. Start a normal swing and confirm backswing, top, downswing, impact, ball launch and follow-through all complete.
2. Pause, select **Restart Hole**, and complete another swing.
3. Pause, select **Exit to Title**, begin another round, and complete another swing.
4. Pause during ball flight, resume and confirm the same flight continues.
