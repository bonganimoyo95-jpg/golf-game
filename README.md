# Fairways & Friends Pocket Golf

An original browser golf mini-game inspired by the compact aim-and-timing loop of early mobile golf games. This repository contains the first checkpoint of Project 1: the technical foundation.

## What works in this checkpoint

- Responsive 352 × 440 Phaser canvas
- Fairways & Friends placeholder visual system
- Title screen and hole-introduction screen
- Split overhead-map and golfer-view game screen
- Four configurable clubs
- Left/right aiming and projected landing area
- Three-input swing demonstration: start, power and accuracy
- Placeholder ball-flight animation
- Keyboard and touch controls
- Pause, restart and return-to-title controls

The shot animation is intentionally labelled as a preview. Final terrain detection, ball physics, putting and scoring arrive in later checkpoints.

## Run the game locally

### Requirements

- Node.js 22 LTS
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
npm run build
```

The production website is generated in `dist/`. That folder is intentionally ignored by Git because it can be rebuilt at any time.

## Project documents

- [`docs/PROJECT_0_SPEC.md`](docs/PROJECT_0_SPEC.md) — approved product specification
- [`docs/PROJECT_1_CHECKPOINT.md`](docs/PROJECT_1_CHECKPOINT.md) — scope and next tasks

## Technical choices

- Phaser 3.90
- TypeScript 5.9
- Vite 7
- No backend
- No runtime AI API
- No extracted art or audio from the 2004 reference game
