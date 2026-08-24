import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from '../data';
import { TEE_POSITION, getLieAt } from '../courseModel';
import {
  calculateShot,
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
    const wedge = calculateShot({ ...baseInput, club: CLUBS[2] });
    expect(driver.totalMetres).toBeGreaterThan(wedge.totalMetres);
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
    const waterShot = calculateShot({ ...baseInput, aimDegrees: -15 });
    expect(waterShot.penalty).toBe(true);
    expect(waterShot.penaltyType).toBe('water');
    expect(waterShot.strokeCost).toBe(2);
    expect(waterShot.penaltyEntry).toBeDefined();
    expect(waterShot.dropPosition).toEqual(waterShot.resolvedEnd);
    expect(waterShot.resolvedEnd).not.toEqual(TEE_POSITION);
    expect(getLieAt(waterShot.resolvedEnd)).not.toBe('water');
  });

  it('recognizes a shot that lands in either greenside bunker', () => {
    const bunkerShot = calculateShot({
      ...baseInput,
      start: { x: 0, y: 300 },
      club: CLUBS[2],
      power: 1,
      aimDegrees: -12,
      startingLie: 'fairway',
    });

    expect(bunkerShot.landingLie).toBe('bunker');
    expect(bunkerShot.resolvedLie).toBe('bunker');
    expect(bunkerShot.penalty).toBe(false);
  });

  it('captures a controlled putt and finishes it at the pin', () => {
    const putt = calculateShot({
      ...baseInput,
      start: { x: 0, y: 382 },
      club: CLUBS[3],
      power: 0.49,
      startingLie: 'green',
    });

    expect(putt.holed).toBe(true);
    expect(putt.resolvedEnd).toEqual({ x: 0, y: PROTOTYPE_HOLE.distanceMetres });
  });

  it('recommends putter power that reaches the requested distance', () => {
    const power = putterPowerForDistance(CLUBS[3], 10, 'green');
    const distance = putterRolloutForPower(CLUBS[3], power, 'green');

    expect(distance).toBeCloseTo(10, 5);
  });

  it('lets an overpowered putt run past the cup', () => {
    const putt = calculateShot({
      ...baseInput,
      start: { x: 0, y: 382 },
      club: CLUBS[3],
      power: 1,
      startingLie: 'green',
    });

    expect(putt.holed).toBe(false);
    expect(putt.totalMetres).toBeGreaterThan(10);
  });

  it('can hole a recovery putt from beyond the cup', () => {
    const putt = calculateShot({
      ...baseInput,
      start: { x: 0, y: 400 },
      club: CLUBS[3],
      power: 0.42,
      aimDegrees: 180,
      startingLie: 'green',
    });

    expect(putt.holed).toBe(true);
    expect(putt.resolvedEnd).toEqual({ x: 0, y: PROTOTYPE_HOLE.distanceMetres });
  });
});
