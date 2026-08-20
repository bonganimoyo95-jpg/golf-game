import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from './data';
import { landscapeCropForPosition, shotBallScreenPosition } from './cameraModel';
import { calculateShot, sampleTrajectory } from './physics/shotPhysics';

const shot = calculateShot({
  start: { x: 0, y: 0 },
  club: CLUBS[0],
  power: 1,
  accuracyError: 0,
  aimDegrees: 0,
  wind: PROTOTYPE_HOLE.wind,
  startingLie: 'tee',
});

describe('shot camera model', () => {
  it('zooms farther into the course as the ball advances', () => {
    const tee = landscapeCropForPosition({ x: 0, y: 0 });
    const fairway = landscapeCropForPosition({ x: 0, y: 210 });
    expect(fairway.width).toBeLessThan(tee.width);
    expect(fairway.height).toBeLessThan(tee.height);
  });

  it('finishes ahead of the address point instead of snapping to the tee', () => {
    const end = shotBallScreenPosition(
      shot,
      sampleTrajectory(shot, 1),
      1,
      'right',
    );
    expect(end.x).toBeGreaterThan(132);
  });

  it('mirrors the chase direction for a left-handed golfer', () => {
    const right = shotBallScreenPosition(shot, sampleTrajectory(shot, 1), 1, 'right');
    const left = shotBallScreenPosition(shot, sampleTrajectory(shot, 1), 1, 'left');
    expect(right.x).toBe(352 - left.x);
  });
});
