import { describe, expect, it } from 'vitest';
import { PIN_POSITION, TEE_POSITION, distanceBetween } from './courseModel';
import { CLUBS, PROTOTYPE_HOLE, type Lie } from './data';
import {
  calculateShot,
  putterPowerForDistance,
  type ShotResult,
} from './physics/shotPhysics';

function takeShot(
  start: ShotResult['resolvedEnd'],
  startingLie: Lie,
  clubIndex: number,
  power: number,
  aimDegrees: number,
): ShotResult {
  return calculateShot({
    start,
    startingLie,
    club: CLUBS[clubIndex],
    power,
    accuracyError: 0,
    aimDegrees,
    wind: PROTOTYPE_HOLE.wind,
  });
}

describe('playable hole', () => {
  it('has a deterministic tee-to-cup route that finishes in par', () => {
    const drive = takeShot({ ...TEE_POSITION }, 'tee', 0, 1, 6);
    const approach = takeShot(drive.resolvedEnd, drive.finalLie, 1, 1, -9);
    const wedge = takeShot(approach.resolvedEnd, approach.finalLie, 2, 0.35, -30);
    const bearingToCup =
      (Math.atan2(
        PIN_POSITION.x - wedge.resolvedEnd.x,
        PIN_POSITION.y - wedge.resolvedEnd.y,
      ) *
        180) /
      Math.PI;
    const puttPower = putterPowerForDistance(
      CLUBS[3],
      distanceBetween(wedge.resolvedEnd, PIN_POSITION),
      'green',
    );
    const putt = takeShot(
      wedge.resolvedEnd,
      wedge.finalLie,
      3,
      puttPower,
      bearingToCup,
    );

    expect(drive.penalty).toBe(false);
    expect(approach.start).toEqual(drive.resolvedEnd);
    expect(approach.penalty).toBe(false);
    expect(wedge.finalLie).toBe('green');
    expect(putt.holed).toBe(true);
    expect(putt.resolvedEnd).toEqual(PIN_POSITION);
  });
});
