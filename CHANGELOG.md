# Changelog

## 0.12.0 — Launch readiness

- Converted the original Hole-13 inspiration into the player-facing **Hole 13 · Azalea Bend** one-hole challenge.
- Added automatic chips from grass inside 45 metres and automatic splash shots from nearby bunkers without adding another club control.
- Added short-game power scaling down to touch distance instead of forcing the full-swing minimum carry.
- Replaced exact PLAY percentages and white answer lines with qualitative swing-strength advice and a shaded playable range.
- Retained honest pin distance, selected-club carry/total and a distinct full-shot endpoint.
- Tightened the single launch balance, with distance-scaled putting speed, contact windows, power bands and cup capture.
- Sampled the complete post-landing ground path so a ball rolling through water or out of bounds always triggers a visible penalty.
- Added a three-step first-play tutorial that can be reopened from the pause menu.
- Added persistent mute, automatic hidden-tab pause, tee-specific local best scores and immediate Play Again.
- Added recoverable gameplay-asset loading errors, a title fallback and mobile safe-area/overscroll handling.
- Added an auto-chip QA scenario and reorganized the QA Lab into a compact nine-scenario grid.
- Added two Playwright browser tests covering scene navigation, tutorial, pause/resume, a complete shot, driver removal, auto-chip and putting difficulty.
- Added GitHub Actions verification for typecheck, 86 unit tests, production build and browser smoke tests.
- Updated deterministic replay records to the v0.12 format.

## 0.11.0 — Shot planning and recovery clarity

- Increased the rated club ladder to Driver 250 m, 3-wood 220 m, Iron 165 m, Wedge 95 m and Putter 30 m.
- Added a clear **PIN** distance readout plus rated full-swing carry and total distance for the selected club.
- Added separate **PLAY** and **FULL** targets to the overhead map, with matching target symbols in the lower course view.
- Added deterministic club and power recommendations plus a white meter guide for every club.
- Kept planning distances honest by excluding the optional three-percent pure-contact bonus from pre-shot projections.
- Made all full-shot aiming relative to the pin, so recovery shots from beyond the green correctly face back toward the cup.
- Added a visible projected flag to the full-shot course view.
- Extended the playable recovery apron behind the green so visible shots no longer trigger an unexplained rear-boundary penalty.
- Added pre-shot water/out-of-bounds warnings and prominent post-shot penalty banners explaining the stroke and drop location.
- Added dedicated regression coverage for club scaling, target power, PLAY/FULL separation, rear-green aiming, rated distances and warnings.
- Expanded automated coverage to 74 tests across 16 files.

## 0.10.0 — Azalea Bend production polish

- Rebuilt the playable hole as the original 476-metre par-5 **Azalea Bend**, inspired by the strategic rhythm of a famous dogleg-left creek hole without copying licensed branding or exact geometry.
- Added a single authoritative dogleg, inside creek, creek-fronted green and three rear bunkers shared by lie detection, the overhead map and the projected course view.
- Added a properly tuned 3-wood between driver and iron, available from tee, fairway and rough but excluded from bunkers.
- Added a tested driver–3-wood–wedge risk/reward route that can reach the cup in par or better.
- Redesigned the 3/4-circle meter with a slimmer visual rail, compact marker, clearer power bands and visible accuracy window.
- Added deterministic distance-scaled putting difficulty: wider and slower for short putts, narrower and faster for long putts.
- Added a visible suggested-power tolerance band that narrows as putt distance increases.
- Corrected both golfers' putting feet, hips and shoulders so their stance line runs parallel to the ball-to-cup line.
- Added a deliberate top-of-swing transition, impact hold, club-trail cue, contact flash and lie-specific landing effects.
- Added restrained procedural swing, impact, landing and cup audio without adding runtime audio assets.
- Added richer mowing bands, creek banks, pine depth and azalea clusters while keeping course art tied to playable geometry.
- Expanded automated coverage to 67 tests across 15 files.

## 0.9.0 — Putting perspective and game feel

- Rebuilt putting around a down-the-line camera with the ball and cup on one centred forward axis.
- Made handedness move only the golfer's stance while keeping the cup, flag and physical target fixed.
- Added distance-scaled cup depth, perspective mowing lines and new rear three-quarter putting poses for both golfers.
- Added a cup-front depth layer and a short sink animation before hole completion.
- Replaced independent swing delay calls with one continuous, pause-safe 800 ms visual timeline.
- Moved full-swing impact and ball launch from 930 ms to a more natural 520 ms while preserving the held finish.
- Added subtle interpolated golfer root motion between existing full-swing poses.
- Added a smooth, capped three-percent carry reward for pure contact and explicit bonus feedback.
- Kept putter distance free of hidden contact bonuses so suggested power remains honest.
- Added an Augusta-11-inspired procedural presentation pass with pine framing, dogwood colour and richer water and bunker treatment.
- Added dedicated regression coverage for putting composition, target depth, pure-contact tuning and swing timing.
- Expanded automated coverage to 61 tests across 14 files.

## 0.8.1 — Swing lifecycle correction

- Fixed a Phaser Clock pause state that survived restarting or leaving `GameScene` from the pause menu.
- Restored the scene clock and tween manager before every restart, paused-scene exit and fresh gameplay start.
- Prevented the golfer from freezing on the first backswing frame while the meter and buttons remained responsive.
- Added regression coverage for restoring paused scene systems.
- Expanded automated coverage to 53 tests across 13 files.

## 0.8.0 — Course, camera and QA architecture release

- Added one authoritative course definition for bounds, tees, fairway shape, lakes, green, bunkers and pin.
- Replaced the hand-matched overhead gameplay image with a procedural map drawn from the exact collision geometry.
- Replaced panorama cropping in gameplay with a position-aware 2.5D projection from the current ball and moving chase camera.
- Made the lower course view render fairway and hazard positions from the same world coordinates used by shot physics.
- Added direct-start QA scenarios for tee, fairway, rough, bunker, 6-metre and 18-metre putts, water drops and out-of-bounds.
- Added deterministic replay records that reproduce shot inputs and resolved outcomes, persist locally, and can be copied from the QA pause menu.
- Separated golfer appearance, handedness and tee choice; both golfers now use identical club distances.
- Added selected-state feedback to golfer, stance and tee controls.
- Deferred golfer and course art until Play is pressed instead of loading every asset before the title screen.
- Removed internal checkpoint copy from the public title and hole-introduction screens.
- Capped the desktop presentation at the native 352-pixel canvas width for sharper pixel rendering.
- Expanded automated coverage from 42 to 52 tests across 12 files.

## 0.7.1 — Gameplay QA correction release

- Removed the late-flight screen reversal that made the ball appear to travel back toward the tee while the camera caught up.
- Held the landing camera on the resolved ball position until the deliberate cut to the next address view.
- Froze both delayed swing events and active tweens while paused, preventing shots from continuing behind the pause overlay.
- Kept the putting cup and flag fixed in place while allowing the player's aim line to move honestly around the target.
- Made missed-putt screen motion use the same angular miss represented by the shot model.
- Limited green aim adjustments to a readable eight-degree range.
- Hid the flight ball when a penalty resolves to a different legal ball position.
- Added runtime asset-manifest, monotonic camera, mirrored putting, shot-origin and bunker-shot regression coverage.
- Expanded automated coverage from 36 to 42 tests across 10 files.

## 0.7.0 — Camera, flight and identity release

- Replaced both playable golfers with twelve-pose pixel-art versions of the man and woman in the supplied Fairways & Friends photo.
- Replaced the title screen with the approved Fairways & Friends Pocket Golf cover artwork.
- Reconciled the tee panorama with the aerial map so both depict the same fairway bend, water and greenside bunkers.
- Added a world-position camera model that reframes the course from every new ball location.
- Added a forward camera chase through flight, bounce and rollout, followed by a landing zoom that never snaps back to the tee.
- Changed the airborne path to a club-sensitive asymmetric arc with a distinct descent and diminishing bounces.
- Kept the putting cup, flag and roll path on the golfer's visible aim line for either handedness.
- Added exact suggested putt power to the HUD and a reference marker on the swing meter.
- Restricted the driver to tee shots and added tested lie-based club lists.
- Expanded automated coverage to 36 tests.

## 0.6.0 — Gameplay correction release

- Replaced the male golfer's red shirt with a clean white shirt.
- Added original male/female and right/left-handed selection before teeing off.
- Added shorter female club distances and a front tee that shortens the hole by 42 metres.
- Mirrored the golfer, ball-flight direction and shot-meter placement for left-handed play.
- Slowed the character swing and held the follow-through through ordinary shot results.
- Removed disappointed and ball-watching reactions from regular shots.
- Rebuilt putting as a side-on, cup-facing view consistent with the full-shot camera.
- Moved the polished 3/4-circle shot meter to the side opposite the golfer.
- Made the camera recenter on the ball's new lie after every shot.
- Added water-entry drops instead of replaying from the water or previous position.
- Realigned greenside bunker detection with the illustrated hazards and prioritised sand over green.
- Added a persistent, high-contrast lie badge for tee, fairway, rough, bunker and green.
- Expanded automated coverage to 29 tests.

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
