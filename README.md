# Fairways & Friends Pocket Golf

An original browser golf mini-game inspired by the compact aim-and-timing loop of early mobile golf games. This repository contains v0.8.1, the swing-lifecycle correction following the course, camera and QA architecture release.

## What works now

- Responsive 352 × 440 Phaser canvas
- Photo-derived male and female pixel-art golfers based on the Fairways & Friends hosts
- Fairways & Friends Pocket Golf illustrated cover screen
- Pre-round golfer, right/left-handed stance and independent tee selection
- Mirrored play direction and meter placement for left-handed golfers
- Identical club performance for both golfers; back/forward tees are a player choice
- Twelve consistent poses per golfer covering setup, swing, putting and scoring
- Slower, smoother backswing-to-impact sequence with a held follow-through
- One authoritative course definition shared by surface detection and both gameplay views
- Procedurally drawn overhead fairway, lakes, green, bunkers and tees that cannot drift from collision geometry
- Position-aware 2.5D lower course view projected from the ball instead of cropping one tee panorama
- Updated title and score screens using the new golfer and course artwork
- Title screen and hole-introduction screen
- Split overhead-map and golfer-view game screen
- Four configurable clubs
- Left/right aiming and projected landing area
- One-pass 3/4-circle swing meter: start, select power and strike at the contact line
- Faster downswing timing after higher-power selections
- Early and late contact feedback with no meter looping or second chance
- Deterministic club, power, accuracy, aim, wind and lie calculations
- Different carry, trajectory and rollout behavior for each club
- Airborne flight, landing, bounce and rollout phases
- Ball position and next-shot camera origin retained after every landing
- Forward-chasing world camera that moves along the calculated trajectory and settles at the landing position
- Directionally correct, asymmetric airborne arc plus bounce and rollout
- Prominent live distance-to-pin and lie display
- Fairway, rough, bunker, green, water and out-of-bounds detection
- Water penalties that drop the ball at the point of entry
- Out-of-bounds penalties that return to the previous spot
- Bunker-first surface classification that cannot incorrectly force the putter
- Side-on putting view aligned with the direction of play and the cup
- Fixed putting target with an independently adjustable, mirrored aim line
- Green scenery that retains the same horizon and course environment
- One-degree putting aim adjustments and a visible suggested-power marker
- Tee-only driver selection; fairway, rough and bunker club lists follow the lie
- Slower putting-meter timing and beginner-friendly cup capture
- Short-distance putter power control and line-based cup capture
- Hole completion with strokes and score relative to par
- Replay and return-to-title choices after completing the hole
- Keyboard and touch controls
- Pause, restart and return-to-title controls
- Pause behavior that freezes swing timers and ball-flight tweens together
- Optional `?qa=1` scenario lab for tee, fairway, rough, bunker, putting, water and out-of-bounds checks
- Deterministic per-shot replay logs, local persistence and QA-mode clipboard export
- Deferred gameplay-art loading after the title screen
- Native 352-pixel desktop canvas sizing for crisper pixel presentation

Audio, additional holes, advanced shot types and final character/effects polish remain intentionally deferred. v0.8.0 still requires the final hands-on Codespaces acceptance pass described in `docs/PROJECT_2_CHECKPOINT_1.md`.

## Run the game locally

### Requirements

- Node.js 22 or newer, or a GitHub Codespace
- npm, which is included with Node.js

### Steps

1. Open this folder in a terminal.
2. Install the project packages:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local address shown in the terminal, normally `http://localhost:5173`.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Aim | Left / Right Arrow | Left / Right buttons |
| Change club | Up / Down Arrow | Club button |
| Start, select power and strike | Space or Enter | Swing button |
| Pause or resume | Escape | Pause button |
| Restart | `R` | Reset button or pause menu |

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

The production website is generated in `dist/`. That folder is intentionally ignored by Git because it can be rebuilt at any time.

The automated release baseline is `53` passing tests across `13` files.

## QA scenario lab

Append `?qa=1` to the game URL, for example `http://localhost:5173/?qa=1`. The title screen will show **QA Lab**. Each scenario starts directly at a gameplay seam with a tested lie, club and aim preset. While paused in QA mode, **Copy Replay** copies the deterministic shot log for the current run.

## Project documents

- [`docs/PROJECT_0_SPEC.md`](docs/PROJECT_0_SPEC.md) — approved product specification
- [`docs/PROJECT_1_CHECKPOINT.md`](docs/PROJECT_1_CHECKPOINT.md) — scope and next tasks
- [`docs/PROJECT_1_CHECKPOINT_2.md`](docs/PROJECT_1_CHECKPOINT_2.md) — physics checkpoint record
- [`docs/PROJECT_1_CHECKPOINT_3.md`](docs/PROJECT_1_CHECKPOINT_3.md) — playable-hole checkpoint record
- [`docs/PROJECT_1_CHECKPOINT_4.md`](docs/PROJECT_1_CHECKPOINT_4.md) — putting-camera checkpoint record
- [`docs/PROJECT_1_CHECKPOINT_5.md`](docs/PROJECT_1_CHECKPOINT_5.md) — pixel-art checkpoint record
- [`docs/PROJECT_1_CHECKPOINT_6.md`](docs/PROJECT_1_CHECKPOINT_6.md) — gameplay-correction record
- [`docs/PROJECT_1_CHECKPOINT_7.md`](docs/PROJECT_1_CHECKPOINT_7.md) — camera, flight and identity record
- [`docs/PROJECT_1_CHECKPOINT_8.md`](docs/PROJECT_1_CHECKPOINT_8.md) — gameplay QA correction record
- [`docs/PROJECT_2_CHECKPOINT_1.md`](docs/PROJECT_2_CHECKPOINT_1.md) — v0.8 course, camera and QA architecture record
- [`docs/PROJECT_2_CHECKPOINT_2.md`](docs/PROJECT_2_CHECKPOINT_2.md) — paused-clock and swing-freeze correction record

## Technical choices

- Phaser 3.90
- TypeScript 5.9
- Vite 7
- No backend
- No runtime AI API
- No extracted art or audio from the 2004 reference game
