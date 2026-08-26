import { describe, expect, it } from 'vitest';
import {
  SWING_KEYFRAMES,
  SWING_LAUNCH_TIME_MS,
  swingDurationMs,
  swingVisualStateAt,
} from './swingAnimation';

describe('golfer swing animation timeline', () => {
  it('keeps every timeline chronological and bounded', () => {
    for (const kind of ['full', 'putt'] as const) {
      const times = SWING_KEYFRAMES[kind].map((frame) => frame.atMs);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(SWING_LAUNCH_TIME_MS[kind]).toBeLessThanOrEqual(swingDurationMs(kind));
    }
  });

  it('uses a deliberate backswing and a much faster transition to impact', () => {
    const frames = SWING_KEYFRAMES.full;
    const backswingDuration = frames[2].atMs - frames[0].atMs;
    const transitionToImpact = frames[4].atMs - frames[2].atMs;

    expect(backswingDuration).toBeGreaterThan(transitionToImpact);
    expect(frames[4].pose).toBe('impact');
    expect(frames[4].atMs).toBe(SWING_LAUNCH_TIME_MS.full);
  });

  it('interpolates subtle root motion without changing the active pose early', () => {
    const start = swingVisualStateAt('full', 0);
    const midway = swingVisualStateAt('full', 150);
    const finish = swingVisualStateAt('full', 9999);

    expect(start.pose).toBe('address');
    expect(midway.pose).toBe('backswing');
    expect(midway.xOffset).not.toBe(start.xOffset);
    expect(finish.pose).toBe('follow-through');
    expect(finish.elapsedMs).toBe(swingDurationMs('full'));
  });
});
