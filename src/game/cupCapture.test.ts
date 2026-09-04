import { describe, expect, it } from 'vitest';
import {
  CUP_CAPTURE_RADIUS_METRES,
  cupCaptureRadiusForDistance,
  MAX_CAPTURE_OVERRUN_METRES,
  evaluateCupCapture,
} from './cupCapture';

const cup = { x: 0, y: 10 };

describe('cup capture', () => {
  it('captures a putt that finishes on the cup line at controlled speed', () => {
    const result = evaluateCupCapture({ x: 0, y: 0 }, { x: 0.1, y: 10.5 }, cup);

    expect(result.holed).toBe(true);
  });

  it('gives a gently paced short putt a readable capture', () => {
    const result = evaluateCupCapture({ x: 0, y: 0 }, { x: 0.4, y: 10.7 }, cup);

    expect(result.holed).toBe(true);
  });

  it('requires a tighter line as putting distance increases', () => {
    expect(cupCaptureRadiusForDistance(4)).toBeGreaterThan(
      cupCaptureRadiusForDistance(20),
    );
  });

  it('rejects a putt that misses the cup laterally', () => {
    const result = evaluateCupCapture({ x: 0, y: 0 }, { x: 1, y: 10 }, cup);

    expect(result.holed).toBe(false);
    expect(result.closestDistanceMetres).toBeGreaterThan(CUP_CAPTURE_RADIUS_METRES);
  });

  it('rejects a putt travelling too far beyond the cup', () => {
    const result = evaluateCupCapture({ x: 0, y: 0 }, { x: 0, y: 15 }, cup);

    expect(result.holed).toBe(false);
    expect(result.overrunMetres).toBeGreaterThan(MAX_CAPTURE_OVERRUN_METRES);
  });
});
