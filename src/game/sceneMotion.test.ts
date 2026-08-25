import { describe, expect, it, vi } from 'vitest';
import { resumeSceneSystems } from './sceneMotion';

describe('scene motion lifecycle', () => {
  it('clears a clock pause before a game scene restarts or exits', () => {
    const clock = { paused: true };
    const resumeAll = vi.fn();

    resumeSceneSystems(clock, { resumeAll });

    expect(clock.paused).toBe(false);
    expect(resumeAll).toHaveBeenCalledOnce();
  });
});
