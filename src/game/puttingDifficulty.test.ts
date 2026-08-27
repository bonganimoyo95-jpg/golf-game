import { describe, expect, it } from 'vitest';
import {
  puttingAccuracyErrorAt,
  puttingDifficultyForDistance,
} from './puttingDifficulty';

describe('distance-scaled putting difficulty', () => {
  it('makes short putts slower and more forgiving than long putts', () => {
    const short = puttingDifficultyForDistance(3);
    const medium = puttingDifficultyForDistance(10);
    const long = puttingDifficultyForDistance(22);

    expect(short.contactWindow).toBeGreaterThan(medium.contactWindow);
    expect(medium.contactWindow).toBeGreaterThan(long.contactWindow);
    expect(short.meterSpeedMultiplier).toBeLessThan(long.meterSpeedMultiplier);
    expect(short.powerBandHalfWidth).toBeGreaterThan(long.powerBandHalfWidth);
  });

  it('turns the same timing miss into a larger directional error from distance', () => {
    const timingMiss = 0.1;
    expect(Math.abs(puttingAccuracyErrorAt(timingMiss, 22))).toBeGreaterThan(
      Math.abs(puttingAccuracyErrorAt(timingMiss, 3)),
    );
  });

  it('uses readable difficulty labels at the QA distances', () => {
    expect(puttingDifficultyForDistance(6).label).toBe('FORGIVING');
    expect(puttingDifficultyForDistance(10).label).toBe('STANDARD');
    expect(puttingDifficultyForDistance(18).label).toBe('PRECISION');
  });
});
