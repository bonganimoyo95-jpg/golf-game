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
  it('has a deterministic driver, 3-wood and wedge route in par or better', () => {
    const bearingToPin = (position: ShotResult['resolvedEnd']): number =>
      (Math.atan2(
        PIN_POSITION.x - position.x,
        PIN_POSITION.y - position.y,
      ) *
        180) /
      Math.PI;

    const drive = takeShot({ ...TEE_POSITION }, 'tee', 0, 1, 0);
    const wood = takeShot(
      drive.resolvedEnd,
      drive.finalLie,
      1,
      1,
      bearingToPin(drive.resolvedEnd),
    );
    const wedge = takeShot(
      wood.resolvedEnd,
      wood.finalLie,
      3,
      1,
      bearingToPin(wood.resolvedEnd),
    );
    const bearingToCup =
      (Math.atan2(
        PIN_POSITION.x - wedge.resolvedEnd.x,
        PIN_POSITION.y - wedge.resolvedEnd.y,
      ) *
        180) /
      Math.PI;
    const puttPower = putterPowerForDistance(
      CLUBS[4],
      distanceBetween(wedge.resolvedEnd, PIN_POSITION),
      'green',
    );
    const putt = takeShot(
      wedge.resolvedEnd,
      wedge.finalLie,
      4,
      puttPower,
      bearingToCup,
    );

    expect(drive.penalty).toBe(false);
    expect(wood.start).toEqual(drive.resolvedEnd);
    expect(wood.penalty).toBe(false);
    expect(wedge.finalLie).toBe('green');
    expect(putt.holed).toBe(true);
    expect(putt.resolvedEnd).toEqual(PIN_POSITION);
    expect(4).toBeLessThanOrEqual(PROTOTYPE_HOLE.par);
  });
});
