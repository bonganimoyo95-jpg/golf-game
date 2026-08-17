import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from '../data';
import { TEE_POSITION } from '../courseModel';
import { calculateShot, sampleTrajectory, type ShotInput } from './shotPhysics';

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

  it('adds a penalty and restores the previous position after water', () => {
    const waterShot = calculateShot({ ...baseInput, aimDegrees: -16 });
    expect(waterShot.penalty).toBe(true);
    expect(waterShot.strokeCost).toBe(2);
    expect(waterShot.resolvedEnd).toEqual(TEE_POSITION);
  });
});
