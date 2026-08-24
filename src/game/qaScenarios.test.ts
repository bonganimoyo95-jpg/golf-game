import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from './data';
import { calculateShot } from './physics/shotPhysics';
import { QA_SCENARIOS, resolveQaScenario } from './qaScenarios';

const profile = {
  gender: 'female' as const,
  handedness: 'left' as const,
  tee: 'back' as const,
};

describe('QA scenarios', () => {
  it('starts each scenario on its declared playable lie', () => {
    for (const scenario of QA_SCENARIOS) {
      const resolved = resolveQaScenario(scenario.id, profile);
      expect(resolved).toBeDefined();
      if (scenario.expectedLie) expect(resolved?.lie).toBe(scenario.expectedLie);
    }
  });

  it('respects the selected tee in the tee scenario', () => {
    const tee = resolveQaScenario('tee', profile);
    expect(tee?.position).toEqual({ x: 0, y: 0 });
    expect(tee?.lie).toBe('tee');
  });

  it('provides deterministic water and out-of-bounds probes', () => {
    for (const [id, penaltyType] of [
      ['water-drop', 'water'],
      ['out-of-bounds', 'outOfBounds'],
    ] as const) {
      const scenario = resolveQaScenario(id, profile)!;
      const result = calculateShot({
        start: scenario.position,
        startingLie: scenario.lie,
        club: CLUBS[scenario.clubIndex],
        power: 1,
        accuracyError: 0,
        aimDegrees: scenario.aimDegrees,
        wind: PROTOTYPE_HOLE.wind,
      });
      expect(result.penaltyType).toBe(penaltyType);
    }
  });
});
