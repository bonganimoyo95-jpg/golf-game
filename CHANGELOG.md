# Changelog

## 0.3.0 — First completable hole

- Added a dedicated gridded putting view when the ball reaches the green.
- Added fine short-distance putter power control while preserving the one-pass swing meter.
- Added line-based cup capture with tolerance for controlled pace and rejection of hard overruns.
- Added hole completion, stroke totals and score-to-par labels.
- Added replay and return-to-title actions after finishing the hole.
- Added automated cup-capture, putting-physics and scoring tests.

## 0.2.1 — One-pass swing meter

- Replaced the semicircular placeholder with a 3/4-circle meter around the golfer.
- Added fixed 50% and 75% power ticks and a white contact line.
- Made power selection reverse the marker from its exact locked position.
- Made higher-power selections produce a faster downswing.
- Removed looping and added automatic maximum-power and late-miss outcomes.
- Added early, perfect and late contact feedback plus automated meter tests.

## 0.2.0 — Shot physics sandbox

- Replaced the scripted shot preview with deterministic shot calculations.
- Added club-specific launch, carry, bounce and rollout behavior.
- Connected power, accuracy, aim, wind and lie to every shot result.
- Added persistent ball position and live distance remaining.
- Added course-surface detection and penalty handling.
- Added automated physics tests.

## 0.1.0 — Technical foundation

- Added the responsive Phaser and TypeScript application shell.
- Added title, hole-introduction, gameplay and pause screens.
- Added keyboard, touch and three-input meter controls.
