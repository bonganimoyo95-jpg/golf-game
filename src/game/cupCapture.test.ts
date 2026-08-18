import { describe, expect, it } from 'vitest';
import { evaluateCupCapture } from './cupCapture';

const cup = { x: 0, y: 10 };

describe('cup capture', () => {
  it('captures a putt that finishes on the cup line at controlled speed', () => {
    const result = evaluateCupCapture({ x: 0, y: 0 }, { x: 0.1, y: 10.5 }, cup);

    expect(result.holed).toBe(true);
  });

  it('rejects a putt that misses the cup laterally', () => {
    const result = evaluateCupCapture({ x: 0, y: 0 }, { x: 1, y: 10 }, cup);

    expect(result.holed).toBe(false);
    expect(result.closestDistanceMetres).toBeGreaterThan(0.34);
  });

  it('rejects a putt travelling too far beyond the cup', () => {
    const result = evaluateCupCapture({ x: 0, y: 0 }, { x: 0, y: 15 }, cup);

    expect(result.holed).toBe(false);
    expect(result.overrunMetres).toBeGreaterThan(1.2);
  });
});
