# Project 1 — Checkpoint 5

## Goal

Replace the temporary geometric presentation with a cohesive original STICK pixel-art package while preserving the validated shot physics, swing meter, putting and scoring systems.

## Character direction

The golfer is an original fictional athletic Black male STICK character. The red shirt, black pants and confident tournament presence intentionally evoke a familiar championship golf mood, but the character uses an original face, proportions, cap monogram and clothing details with no real-world sponsor marks.

## Included

- [x] Original STICK golfer character
- [x] Side-view idle and address poses
- [x] Backswing and top-of-swing poses
- [x] Downswing and impact poses
- [x] Follow-through and ball-watching poses
- [x] Back-view putting address and stroke poses
- [x] Celebration and disappointed reaction poses
- [x] Timed full-swing animation connected to ball launch
- [x] Timed putting animation connected to ball roll
- [x] Original side-view Pacific Northwest course panorama
- [x] Original overhead pixel-art par-4 course map
- [x] Updated title-screen character presentation
- [x] Updated putting composition using the new back-view golfer
- [x] Updated result screen with the celebration pose
- [x] Pixel-art rendering with nearest-neighbour scaling

## Asset locations

- Asset registry: `src/game/assets.ts`
- Character frames: `public/assets/golfer-*.png`
- Side-view course: `public/assets/course-panorama.png`
- Overhead course: `public/assets/course-map.png`
- Asset loading: `src/game/scenes/BootScene.ts`
- Animation timing: `src/game/scenes/GameScene.ts`

## Acceptance tests

- [ ] Every scene loads without missing-texture markers.
- [ ] The title screen shows the STICK golfer cleanly against the course.
- [ ] The full-swing frames play in the correct order.
- [ ] Ball flight begins at the impact frame.
- [ ] The golfer remains in the follow-through or watching pose during flight.
- [ ] The back-view putting pose leaves a clear line to the cup.
- [ ] The putter stroke plays before the ball starts rolling.
- [ ] A holed putt triggers the celebration pose and result screen.
- [ ] A penalty displays the disappointed reaction before setup resets.
- [ ] The overhead ball marker and aim guide remain readable on the new map.
- [ ] Touch and keyboard controls behave exactly as in v0.4.

## Next checkpoint

Add sound, impact feedback, subtle camera effects and final gameplay polish before expanding beyond the single-hole prototype.
