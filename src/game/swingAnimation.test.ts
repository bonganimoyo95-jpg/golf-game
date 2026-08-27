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
    const firstTop = frames.find((frame) => frame.pose === 'top')!;
    const impact = frames.find(
      (frame) =>
        frame.pose === 'impact' && frame.atMs === SWING_LAUNCH_TIME_MS.full,
    )!;
    const backswingDuration = firstTop.atMs - frames[0].atMs;
    const transitionToImpact = impact.atMs - firstTop.atMs;

    expect(backswingDuration).toBeGreaterThan(transitionToImpact);
    expect(impact.pose).toBe('impact');
    expect(impact.atMs).toBe(SWING_LAUNCH_TIME_MS.full);
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
