import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from './data';
import { calculateShot } from './physics/shotPhysics';
import { QA_SCENARIOS, resolveQaScenario } from './qaScenarios';
import { absoluteAimFromPin } from './shotPlanning';
import { effectiveClubForShot } from './shortGame';
import { distanceToPin } from './courseModel';

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
    expect(tee?.position).toEqual({ x: 38, y: 0 });
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
        aimDegrees: absoluteAimFromPin(scenario.position, scenario.aimDegrees),
        wind: PROTOTYPE_HOLE.wind,
      });
      expect(result.penaltyType).toBe(penaltyType);
    }
  });

  it('includes direct probes for both automatic short-game styles', () => {
    const chip = resolveQaScenario('chip', profile)!;
    const bunker = resolveQaScenario('bunker', profile)!;
    expect(
      effectiveClubForShot(CLUBS[chip.clubIndex], distanceToPin(chip.position), chip.lie)
        .shotStyle,
    ).toBe('chip');
    expect(
      effectiveClubForShot(
        CLUBS[bunker.clubIndex],
        distanceToPin(bunker.position),
        bunker.lie,
      ).shotStyle,
    ).toBe('splash');
  });
});
