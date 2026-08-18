# Fairways & Friends Golf Game Specification

**Document status:** Approved — Project 0 complete  
**Version:** 1.0  
**Date:** August 14, 2026  
**Reference:** *Golf* for Motorola RAZR V3, developed by IOMO (2004)

## 1. Product vision

Create a browser-based golf mini-game inspired by the mechanics and split-screen presentation of IOMO's 2004 Motorola RAZR golf game. The remake will preserve the satisfying aim-and-timing loop while using completely original Fairways & Friends characters, course art, interface elements, sounds and branding.

The experience should feel nostalgic, social and approachable. It should reward skill without punishing beginners and should fit naturally inside the Fairways & Friends digital clubhouse.

## 2. Confirmed product decisions

| Decision | Approved direction |
| --- | --- |
| Creative approach | Motorola-inspired mechanics with original Fairways & Friends branding |
| Visual style | Crisp pixel art using the Fairways & Friends palette |
| Screen composition | Preserve the overhead hole map plus side-view golfer |
| Platform | Browser-based; mobile-first with desktop support |
| Orientation | Portrait |
| Logical resolution | 352 × 440 pixels, scaling responsively at integer multiples where possible |
| Prototype content | One original par-4 hole |
| Initial mode | Practice only |
| Swing mechanic | Three-input swing: start, lock power, lock accuracy |
| Difficulty | More forgiving than the original game |
| Character | One original golfer in the prototype |
| Progression | Shops, equipment, money and attributes deferred |
| Backend | None for the prototype |
| Multiplayer | Deferred |

## 3. Intended player

The prototype is designed for beginners, casual golfers, experienced golfers and the golf-curious. A player should understand the basic interaction within one attempted shot and be able to complete the hole without reading a long tutorial.

## 4. Prototype scope

### Included

- One original par-4 hole
- Overhead hole map
- Side-view golfer and course view
- Four clubs: driver, iron, wedge and putter
- Left/right aiming
- Wind strength and direction
- Three-input power-and-accuracy meter
- Ball flight, bounce and rollout
- Fairway, rough, bunker, water and green behaviour
- Automatic putting mode
- Stroke count, par and score relative to par
- Desktop keyboard controls
- Mobile touch controls
- Pause, restart and exit controls
- Original pixel artwork and sound effects

### Added after the basic shot works

- Normal, punch and chip shot selection
- Forward- and backspin aftertouch
- Trees or other physical obstructions
- Additional animation and sound polish

### Excluded from the prototype

- Additional holes
- Competition mode
- Challenge mode
- Head-to-Head mode
- Online multiplayer
- Accounts or login
- Online leaderboards
- Shop, money and equipment upgrades
- Caddie tips
- Character attributes or customization
- Database or server-side game state

## 5. Reference-game findings

The reference game uses the following core structure:

1. The overhead map shows the full hole, intended line and current ball position.
2. The lower view shows the golfer, current lie and immediate surroundings.
3. The player selects a club and adjusts the shot direction.
4. A single 3/4-circle meter handles both power and accuracy.
5. The first input starts the meter.
6. The second input locks shot power at its current position and immediately reverses the marker.
7. Higher power produces a faster return, and the third input locks accuracy at the white contact line.
8. The marker never loops or resets; maximum power and a missed contact line resolve automatically.
9. The golfer swings and the overhead map communicates ball travel.
10. The ball finishes on a detected surface and the next shot begins.
11. On the green, the game changes to a gridded putting view.
12. The hole ends when the ball reaches the cup and the score is displayed.

The original also includes normal, punch and chip shots; forward/backspin aftertouch; Practice, Competition, Challenge and same-device Head-to-Head modes; an 18-hole course; equipment; money; caddie tips; records; and character attributes. Those systems are not required to prove the core golf experience.

## 6. Game-screen layout

The screen is divided into four functional regions:

| Region | Contents |
| --- | --- |
| Top map | Hole layout, hazards, cup, ball marker, aim line and projected landing area |
| Status strip | Hole number, stroke number, par, distance to pin and wind |
| Main view | Golfer, current terrain, swing animation, meter and ball feedback |
| Bottom controls | Club, lie, shot type and context-sensitive mobile buttons |

The map and main view remain visible during normal shot setup. Temporary result messages may overlay the main view but must not permanently obscure the ball position or score.

## 7. Control map

### Desktop controls

| Action | Control |
| --- | --- |
| Aim left/right | Left Arrow / Right Arrow |
| Previous/next club | Down Arrow / Up Arrow |
| Cycle normal, punch and chip | `S` |
| Start meter | Space or Enter |
| Lock power | Space or Enter |
| Lock accuracy | Space or Enter |
| Add forward/backspin while airborne | Up Arrow / Down Arrow |
| Pause or return | Escape |
| Confirm menu selection | Enter |

### Mobile controls

| Action | Control |
| --- | --- |
| Aim | Large left/right buttons |
| Change club | Club button opens a compact selector |
| Change shot type | Shot-type button cycles available types |
| Start/lock meter | Large central Swing button |
| Add spin | Contextual forward/backspin buttons shown only during travel |
| Pause or exit | Pause button in the upper corner |

Touch targets must be at least 44 CSS pixels and must not trigger page scrolling or browser zoom while the player is interacting with the game.

## 8. Game states

| State | Player action | Exit condition | Next state |
| --- | --- | --- | --- |
| Boot | None | Assets and configuration load | Title |
| Title | Select Play | Play selected | Hole introduction |
| Hole introduction | Review par and layout | Continue selected | Shot setup |
| Shot setup | Select club, aim and shot type | Swing selected | Power meter |
| Power meter | Lock desired power | Power locked | Accuracy meter |
| Accuracy meter | Lock desired accuracy | Accuracy locked | Swing animation |
| Swing animation | Optional spin input | Contact animation finishes | Ball travel |
| Ball travel | Optional forward/backspin | Ball stops | Lie resolution |
| Lie resolution | None | Surface and penalties resolved | Shot setup or putting setup |
| Putting setup | Aim and review distance | Swing selected | Putting meter |
| Putting meter | Lock putting power and accuracy | Inputs complete | Putt travel |
| Putt travel | None | Ball stops or enters cup | Putting setup or hole complete |
| Hole complete | Review score | Replay or exit selected | Hole introduction or title |
| Paused | Resume, restart or exit | Selection made | Previous state, hole introduction or title |

The game must reject inputs that do not belong to the current state. A double tap or held key must not accidentally skip multiple meter stages.

## 9. Detailed gameplay rules

### 9.1 Hole start

- Display the hole number, par, total distance and overhead layout.
- Place the ball on the tee and set the stroke count to zero.
- Begin with the driver selected unless another club is more appropriate for the current lie.
- Generate or load the hole's wind vector.
- Transition into shot setup after the player confirms.

### 9.2 Shot setup

- The player can change clubs and aim before starting the meter.
- The overhead map displays the current aim line and approximate landing area.
- The projected landing area uses the selected club's base distance and current lie, but does not reveal exact wind or timing outcomes.
- Club selection is limited by the current surface. The putter is available only on the green.

### 9.3 Three-input swing

1. The first input starts the power marker moving upward around the semicircular gauge.
2. The second input locks power. Reaching the red overswing zone can exceed 100% power but increases the speed or difficulty of the accuracy return.
3. The marker reverses toward the accuracy target.
4. The third input locks accuracy.
5. Missing left or right of the accuracy target produces a corresponding directional error.
6. A near-centre result receives a clear Perfect cue.

The prototype should be forgiving: a moderate accuracy miss must still produce a playable shot rather than an extreme hook or slice.

### 9.4 Shot calculation

Every shot is calculated from:

- Club base distance and loft
- Locked power percentage
- Locked accuracy offset
- Aim angle
- Shot type
- Wind vector
- Current lie modifier
- Optional spin input
- Small bounded variation, if enabled

The calculation must be deterministic when the same inputs and random seed are used. All tuning values must live in configuration data rather than being scattered through animation code.

### 9.5 Ball travel

- The golfer completes a readable swing animation.
- The ball follows an arc based on club loft and shot type.
- The overhead map updates the ball marker during travel.
- The ball bounces after landing and then rolls.
- Bounce height and rollout depend on surface, landing speed and spin.
- A short result message reports total distance after the ball stops.

### 9.6 Surfaces

| Surface | Initial prototype behaviour |
| --- | --- |
| Tee | Clean lie; full club performance |
| Fairway | Clean lie; full or nearly full performance |
| Rough | Reduced distance and moderately increased dispersion |
| Bunker | Strongly reduced distance and increased dispersion; wedge encouraged |
| Green | Automatically enter putting mode |
| Water/out of bounds | Add one penalty stroke and return the ball to its previous valid position |

Exact modifiers will be tuned during the shot-sandbox project.

### 9.7 Putting

- Enter putting mode automatically when the ball stops on the green.
- Show a gridded green, cup direction and distance.
- Select the putter automatically.
- Use a slower version of the three-input meter.
- Putting power determines roll distance; accuracy determines starting direction.
- The ball drops when its path intersects the cup below the permitted capture speed.
- If the putt misses, the next putt begins from the stopped ball position.

### 9.8 Scoring

- Increment the stroke count once for each completed swing.
- Add penalty strokes separately and label them clearly.
- Display current stroke and par throughout the hole.
- On completion, show total strokes and score relative to par.
- Offer Replay Hole and Return options.

## 10. Initial tuning targets

These are implementation baselines, not permanent balance commitments:

| Club | Approximate maximum distance | Primary use |
| --- | ---: | --- |
| Driver | 200 m | Tee and long fairway shots |
| Iron | 140 m | Approach and recovery shots |
| Wedge | 70 m | Short approaches and bunkers |
| Putter | 25 m | Green only |

The prototype hole should be approximately 380–400 metres and remain completable with imperfect but reasonable inputs.

## 11. Visual and audio direction

### Visual system

- Original pixel art; no extracted IOMO artwork
- Warm clubhouse and modern-community feeling
- Espresso and tobacco brown, burnt orange, warm cream, fairway green and marigold
- One original golfer with clear idle, backswing, impact and follow-through frames
- Readable silhouettes and interface contrast at the logical resolution
- Subtle texture and nostalgia without reducing gameplay clarity
- Interface language should be welcoming and concise

### Audio system

- Original menu, selection, meter, swing, impact, landing, bunker, water and cup sounds
- Short sounds that remain clear on phone speakers
- A persistent mute control
- No runtime AI or licensed audio required

## 12. Data and technical boundaries

- Rendering framework: Phaser with TypeScript
- Game delivered as a static browser application
- No OpenAI API required at runtime
- No backend required for the prototype
- Course geometry, clubs, surfaces, wind and tuning stored as editable data
- Local storage may retain mute preference and best local score
- Game must be embeddable in the digital clubhouse without reloading the entire clubhouse experience

## 13. Prototype acceptance criteria

The one-hole prototype is accepted only when all of the following are true:

### Launch and presentation

- [ ] The game loads without console errors.
- [ ] The title screen leads into the hole without a page reload.
- [ ] The 4:5 game canvas remains readable on supported phone and desktop sizes.
- [ ] The overhead map and golfer view remain synchronized.

### Shot setup and meter

- [ ] The player can change among four clubs where permitted.
- [ ] The player can aim left and right.
- [ ] The aim line and approximate landing area update correctly.
- [ ] One deliberate input is required for each of start, power and accuracy.
- [ ] The power marker reverses from the selected position without jumping, resetting or looping.
- [ ] Higher selected power produces a faster return to the contact line.
- [ ] Missing the maximum or contact line resolves automatically without another attempt.
- [ ] Held or duplicated input does not skip a meter stage.
- [ ] Early, centre and late accuracy inputs visibly change shot direction.

### Ball behaviour

- [ ] Club, power, aim, accuracy, wind and lie affect the result.
- [ ] The ball displays flight, bounce and rollout.
- [ ] The final overhead-map position matches the resolved game position.
- [ ] Fairway, rough, bunker, water and green are detected correctly.
- [ ] Water and out-of-bounds penalties are applied once and clearly reported.

### Putting and scoring

- [ ] Landing on the green enters putting mode automatically.
- [ ] Putt distance responds predictably to meter power.
- [ ] The cup accepts appropriately paced putts.
- [ ] Every swing and penalty is counted correctly.
- [ ] Completing the hole displays the correct score relative to par.
- [ ] Replay resets all hole state without refreshing the browser.

### Controls and reliability

- [ ] The complete hole is playable with keyboard only.
- [ ] The complete hole is playable with touch only.
- [ ] Touch controls do not scroll or zoom the surrounding page.
- [ ] Pause, restart and exit work from every active gameplay state.
- [ ] Ten consecutive completed playthroughs produce no blocking error.

## 14. Project 0 completion record

- [x] Reference recording reviewed
- [x] Original screens and systems catalogued
- [x] Core gameplay loop documented
- [x] Creative direction approved
- [x] Prototype scope approved
- [x] Control map approved
- [x] Game states defined
- [x] Gameplay rules defined
- [x] Technical boundaries defined
- [x] Acceptance criteria defined

**Project 0 is complete.**

## 15. Next project

Project 1 is the technical foundation. Its first checkpoint is a responsive 352 × 440 Phaser canvas that loads a title screen, accepts desktop and touch input, and can transition between placeholder game states. No final artwork or shot physics is required for that checkpoint.
