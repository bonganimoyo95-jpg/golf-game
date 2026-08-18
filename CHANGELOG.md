# Changelog

## 0.5.0 — STICK pixel-art presentation

- Replaced the geometric golfer with an original fictional STICK character in a red-and-black championship palette.
- Added twelve consistent golfer poses for full swings, putting, celebration and disappointment.
- Connected backswing, downswing, impact, follow-through and ball-watching frames to shot timing.
- Added distinct putting-stroke animation and a hole-completion celebration.
- Replaced the flat landscape with an original Pacific Northwest pixel-art course panorama.
- Replaced the geometric overhead layout with a detailed pixel-art hole map.
- Updated the title, putting and result-screen compositions around the new artwork.

## 0.4.0 — Putting camera and readability

- Rebuilt the green view as an over-the-shoulder camera aligned behind the ball and golfer.
- Added a perspective grid, centred cup, flag and live ball-to-target aim line.
- Added on-screen target-power guidance based on the actual remaining distance.
- Changed green aiming from three-degree to one-degree adjustments.
- Slowed the putting meter further to improve timing readability.
- Increased controlled-pace cup capture tolerance while preserving hard overruns.
- Added tested putter-distance and recommended-power helpers.

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
