import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from '../data';
import { PIN_POSITION, TEE_POSITION, getLieAt } from '../courseModel';
import {
  MAX_PURE_CONTACT_CARRY_BONUS,
  calculateShot,
  contactQualityForAccuracy,
  putterPowerForDistance,
  putterRolloutForPower,
  sampleTrajectory,
  type ShotInput,
} from './shotPhysics';

const baseInput: ShotInput = {
  start: TEE_POSITION,
  club: CLUBS[0],
  power: 1,
  accuracyError: 0,
  aimDegrees: 0,
  wind: PROTOTYPE_HOLE.wind,
  startingLie: 'tee',
};

describe('shot physics', () => {
  it('returns the same result for identical inputs', () => {
    expect(calculateShot(baseInput)).toEqual(calculateShot(baseInput));
  });

  it('makes a driver travel farther than a wedge at the same inputs', () => {
    const driver = calculateShot(baseInput);
    const wedge = calculateShot({ ...baseInput, club: CLUBS[3] });
    expect(driver.totalMetres).toBeGreaterThan(wedge.totalMetres);
  });

  it('places the 3-wood cleanly between driver and iron distance', () => {
    const driver = calculateShot(baseInput);
    const wood = calculateShot({ ...baseInput, club: CLUBS[1] });
    const iron = calculateShot({ ...baseInput, club: CLUBS[2] });

    expect(driver.totalMetres).toBeGreaterThan(wood.totalMetres);
    expect(wood.totalMetres).toBeGreaterThan(iron.totalMetres);
  });

  it('makes a lower-power shot travel a shorter distance', () => {
    const full = calculateShot(baseInput);
    const partial = calculateShot({ ...baseInput, power: 0.45 });
    expect(full.totalMetres).toBeGreaterThan(partial.totalMetres);
  });

  it('turns an accuracy miss into directional error', () => {
    const left = calculateShot({ ...baseInput, accuracyError: -0.7 });
    const right = calculateShot({ ...baseInput, accuracyError: 0.7 });
    expect(right.visualEnd.x).toBeGreaterThan(left.visualEnd.x);
  });

  it('awards a capped three-percent carry bonus for pure full-swing contact', () => {
    const pure = calculateShot(baseInput);
    const outsideWindow = calculateShot({
      ...baseInput,
      accuracyError: 0.12,
    });

    expect(pure.carryBonusMetres).toBeCloseTo(
      CLUBS[0].maxDistanceMetres * MAX_PURE_CONTACT_CARRY_BONUS,
      5,
    );
    expect(pure.carryMetres).toBeGreaterThan(outsideWindow.carryMetres);
    expect(outsideWindow.carryBonusMetres).toBe(0);
  });

  it('tapers the contact bonus smoothly instead of using a one-pixel threshold', () => {
    const pure = contactQualityForAccuracy(0);
    const near = contactQualityForAccuracy(0.06);
    const miss = contactQualityForAccuracy(0.12);

    expect(pure).toBe(1);
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(pure);
    expect(miss).toBe(0);
  });

  it('does not add hidden distance to putts', () => {
    const putt = calculateShot({
      ...baseInput,
      start: { x: -33, y: 460 },
      club: CLUBS[4],
      power: 0.49,
      startingLie: 'green',
    });

    expect(putt.contactQuality).toBe(1);
    expect(putt.carryBonusMetres).toBe(0);
  });

  it('reduces distance from the rough', () => {
    const fairway = calculateShot({ ...baseInput, startingLie: 'fairway' });
    const rough = calculateShot({ ...baseInput, startingLie: 'rough' });
    expect(fairway.carryMetres).toBeGreaterThan(rough.carryMetres);
  });

  it('creates an airborne arc and a ground phase', () => {
    const result = calculateShot(baseInput);
    expect(sampleTrajectory(result, 0.35).height).toBeGreaterThan(0);
    expect(sampleTrajectory(result, 1).phase).toBe('roll');
  });

  it('descends from a clear apex before its first bounce', () => {
    const result = calculateShot(baseInput);
    const apex = sampleTrajectory(result, 0.36);
    const descent = sampleTrajectory(result, 0.64);
    expect(apex.height).toBeGreaterThan(descent.height);
    expect(descent.phase).toBe('flight');
  });

  it('adds a penalty and drops at the water entry point', () => {
    const start = { x: -39, y: 345 };
    const aimDegrees =
      (Math.atan2(PIN_POSITION.x - start.x, PIN_POSITION.y - start.y) * 180) /
      Math.PI;
    const waterShot = calculateShot({
      ...baseInput,
      start,
      club: CLUBS[3],
      startingLie: 'fairway',
      aimDegrees,
    });
    expect(waterShot.penalty).toBe(true);
    expect(waterShot.penaltyType).toBe('water');
    expect(waterShot.strokeCost).toBe(2);
    expect(waterShot.penaltyEntry).toBeDefined();
    expect(waterShot.dropPosition).toEqual(waterShot.resolvedEnd);
    expect(waterShot.resolvedEnd).not.toEqual(TEE_POSITION);
    expect(getLieAt(waterShot.resolvedEnd)).not.toBe('water');
  });

  it('detects a creek crossed during rollout even when the planned endpoint is safe', () => {
    const rollingClub = {
      ...CLUBS[1],
      maxDistanceMetres: 28,
      baseRolloutMetres: 30,
      windSensitivity: 0,
    };
    const result = calculateShot({
      ...baseInput,
      start: { x: -26, y: 400 },
      club: rollingClub,
      startingLie: 'fairway',
      wind: { speed: 0, bearingDegrees: 0 },
      aimDegrees: 0,
    });

    expect(result.landingLie).not.toBe('water');
    expect(result.penaltyType).toBe('water');
    expect(result.finalLie).toBe('water');
    expect(result.penaltyEntry).toBeDefined();
    expect(result.dropPosition).toEqual(result.resolvedEnd);
    expect(getLieAt(result.resolvedEnd)).not.toBe('water');
  });

  it('allows an airborne shot to clear the creek and land safely', () => {
    const carryClub = {
      ...CLUBS[2],
      maxDistanceMetres: 60,
      baseRolloutMetres: 0,
      windSensitivity: 0,
    };
    const result = calculateShot({
      ...baseInput,
      start: { x: -26, y: 400 },
      club: carryClub,
      startingLie: 'fairway',
      wind: { speed: 0, bearingDegrees: 0 },
      aimDegrees: 0,
    });

    expect(result.carryEnd.y).toBeGreaterThan(451);
    expect(result.penalty).toBe(false);
    expect(result.resolvedLie).toBe('green');
  });

  it('recognizes a shot that lands in either greenside bunker', () => {
    const start = { x: -33, y: 390 };
    const bunker = { x: -59, y: 485 };
    const bunkerShot = calculateShot({
      ...baseInput,
      start,
      club: CLUBS[3],
      power: 1,
      aimDegrees:
        (Math.atan2(bunker.x - start.x, bunker.y - start.y) * 180) / Math.PI,
      startingLie: 'fairway',
    });

    expect(bunkerShot.landingLie).toBe('bunker');
    expect(bunkerShot.resolvedLie).toBe('bunker');
    expect(bunkerShot.penalty).toBe(false);
  });

  it('captures a controlled putt and finishes it at the pin', () => {
    const power = putterPowerForDistance(CLUBS[4], 10, 'green');
    const putt = calculateShot({
      ...baseInput,
      start: { x: -33, y: 460 },
      club: CLUBS[4],
      power,
      startingLie: 'green',
    });

    expect(putt.holed).toBe(true);
    expect(putt.resolvedEnd).toEqual({ x: -33, y: 470 });
  });

  it('recommends putter power that reaches the requested distance', () => {
    const power = putterPowerForDistance(CLUBS[4], 10, 'green');
    const distance = putterRolloutForPower(CLUBS[4], power, 'green');

    expect(distance).toBeCloseTo(10, 5);
  });

  it('lets an overpowered putt run past the cup', () => {
    const putt = calculateShot({
      ...baseInput,
      start: { x: -33, y: 460 },
      club: CLUBS[4],
      power: 1,
      startingLie: 'green',
    });

    expect(putt.holed).toBe(false);
    expect(putt.totalMetres).toBeGreaterThan(10);
  });

  it('can hole a recovery putt from beyond the cup', () => {
    const power = putterPowerForDistance(CLUBS[4], 10, 'green');
    const putt = calculateShot({
      ...baseInput,
      start: { x: -33, y: 480 },
      club: CLUBS[4],
      power,
      aimDegrees: 180,
      startingLie: 'green',
    });

    expect(putt.holed).toBe(true);
    expect(putt.resolvedEnd).toEqual({ x: -33, y: 470 });
  });
});
