# v0.12.0 launch acceptance

This is the final hands-on check for the one-hole launch release. Complete it in a forwarded Codespaces browser on both desktop and a narrow/mobile viewport if available.

## Normal round

1. Open the title screen. Confirm **Play Round** and the Sound/Mute control both work.
2. Select either golfer, each handedness and each tee at least once. Confirm the selected state remains visible.
3. On the first round, complete all three How To Play cards. Pause later and confirm **How To** reopens them.
4. Hit a tee shot through landing. Confirm the ball and camera only move forward, shot two starts from the landing point and Driver is removed.
5. Confirm the HUD reports PIN distance plus the selected club's rated carry/total.
6. Confirm the map displays a shaded **RANGE** and an orange **FULL** endpoint, while the meter never prints the exact recommended percentage.
7. Switch away from the browser during the power meter and during flight. Return and confirm the game is paused without losing the shot.
8. Complete the hole, confirm the ball sinks, and verify Play Again starts immediately. Complete a better score and confirm **New Best** appears for that tee.

## QA Lab

Append `?qa=1` to the forwarded URL and check:

- **Auto Chip:** the club badge says CHIP and low meter power produces a genuinely short shot.
- **Bunker:** the wedge automatically reads SPLASH and the sand lie remains visible.
- **Putt 6 M / Putt 18 M:** the cup stays directly ahead, feet remain parallel to the putt line, and the 18 m power/contact windows are visibly tighter.
- **Water Drop:** the penalty banner explicitly says `+1 · DROP AT ENTRY` and the next ball appears at a legal point.
- **Out of Bounds:** the banner explicitly says `+1 · PREVIOUS SPOT`.

## Release gate

Do not publish the live URL if GitHub Actions is red, the browser console shows an uncaught error, a penalty occurs without its banner, or a completed putt fails to disappear into the cup.
