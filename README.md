# Fairways & Friends Pocket Golf

An original browser golf mini-game inspired by the compact aim-and-timing loop of early mobile golf games. This repository contains Project 1 Checkpoint 2: the deterministic shot-physics sandbox.

## What works now

- Responsive 352 × 440 Phaser canvas
- Fairways & Friends placeholder visual system
- Title screen and hole-introduction screen
- Split overhead-map and golfer-view game screen
- Four configurable clubs
- Left/right aiming and projected landing area
- Three-input swing demonstration: start, power and accuracy
- Deterministic club, power, accuracy, aim, wind and lie calculations
- Different carry, trajectory and rollout behavior for each club
- Airborne flight, landing, bounce and rollout phases
- Ball position retained between shots
- Live distance-to-pin and final-lie updates
- Fairway, rough, bunker, green, water and out-of-bounds detection
- One-stroke penalties that return the ball to its previous valid position
- Keyboard and touch controls
- Pause, restart and return-to-title controls

Putting, cup capture, hole completion and final presentation polish remain intentionally deferred.

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
| Start and lock swing meter | Space or Enter | Swing button |
| Pause or resume | Escape | Pause button |
| Restart | `R` | Reset button or pause menu |

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

The production website is generated in `dist/`. That folder is intentionally ignored by Git because it can be rebuilt at any time.

## Project documents

- [`docs/PROJECT_0_SPEC.md`](docs/PROJECT_0_SPEC.md) — approved product specification
- [`docs/PROJECT_1_CHECKPOINT.md`](docs/PROJECT_1_CHECKPOINT.md) — scope and next tasks
- [`docs/PROJECT_1_CHECKPOINT_2.md`](docs/PROJECT_1_CHECKPOINT_2.md) — physics checkpoint record

## Technical choices

- Phaser 3.90
- TypeScript 5.9
- Vite 7
- No backend
- No runtime AI API
- No extracted art or audio from the 2004 reference game
