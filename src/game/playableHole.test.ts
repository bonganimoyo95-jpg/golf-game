import { describe, expect, it } from 'vitest';
import { PIN_POSITION, TEE_POSITION, distanceBetween } from './courseModel';
import { CLUBS, PROTOTYPE_HOLE, type Lie } from './data';
import {
  calculateShot,
  putterPowerForDistance,
  type ShotResult,
} from './physics/shotPhysics';
import { buildShotPlan } from './shotPlanning';

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
  it('has a deterministic planned route in par or better', () => {
    const bearingToPin = (position: ShotResult['resolvedEnd']): number =>
      (Math.atan2(
        PIN_POSITION.x - position.x,
        PIN_POSITION.y - position.y,
      ) *
        180) /
      Math.PI;

    const drive = takeShot(
      { ...TEE_POSITION },
      'tee',
      0,
      1,
      bearingToPin(TEE_POSITION),
    );
    const woodPlan = buildShotPlan({
      start: drive.resolvedEnd,
      startingLie: drive.resolvedLie,
      clubs: CLUBS,
      selectedClubIndex: 1,
      relativeAimDegrees: 0,
      wind: PROTOTYPE_HOLE.wind,
    });
    const wood = takeShot(
      drive.resolvedEnd,
      drive.resolvedLie,
      1,
      woodPlan.selected.power,
      bearingToPin(drive.resolvedEnd),
    );
    const bearingToCup =
      (Math.atan2(
        PIN_POSITION.x - wood.resolvedEnd.x,
        PIN_POSITION.y - wood.resolvedEnd.y,
      ) *
        180) /
      Math.PI;
    const puttPower = putterPowerForDistance(
      CLUBS[4],
      distanceBetween(wood.resolvedEnd, PIN_POSITION),
      'green',
    );
    const putt = takeShot(
      wood.resolvedEnd,
      wood.finalLie,
      4,
      puttPower,
      bearingToCup,
    );

    expect(drive.penalty).toBe(false);
    expect(wood.start).toEqual(drive.resolvedEnd);
    expect(wood.penalty).toBe(false);
    expect(wood.finalLie).toBe('green');
    expect(putt.holed).toBe(true);
    expect(putt.resolvedEnd).toEqual(PIN_POSITION);
    expect(3).toBeLessThanOrEqual(PROTOTYPE_HOLE.par);
  });
});
