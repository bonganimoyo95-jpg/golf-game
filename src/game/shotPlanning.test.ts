import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from './data';
import { PIN_POSITION } from './courseModel';
import {
  absoluteAimFromPin,
  buildShotPlan,
  penaltyWarning,
  powerForTargetDistance,
  swingStrengthLabel,
} from './shotPlanning';

const planInput = {
  start: { x: 38, y: 0 },
  startingLie: 'tee' as const,
  clubs: CLUBS,
  selectedClubIndex: 0,
  relativeAimDegrees: 0,
  wind: PROTOTYPE_HOLE.wind,
};

describe('shot planning', () => {
  it('uses the expanded rated club ladder', () => {
    expect(CLUBS.map((club) => club.maxDistanceMetres)).toEqual([
      250, 220, 165, 95, 30,
    ]);
  });

  it('recommends the driver when the tee target exceeds 3-wood range', () => {
    expect(buildShotPlan(planInput).recommended.clubIndex).toBe(0);
  });

  it('provides a partial-power guide for a reachable target', () => {
    const input = {
      ...planInput,
      start: { x: -33, y: 390 },
      startingLie: 'fairway' as const,
      selectedClubIndex: 3,
    };
    const power = powerForTargetDistance(input, 3);
    expect(power).toBeGreaterThan(0.15);
    expect(power).toBeLessThan(1);
  });

  it('keeps a full-shot projection separate from the playable guide', () => {
    const input = {
      ...planInput,
      start: { x: -33, y: 390 },
      startingLie: 'fairway' as const,
      selectedClubIndex: 2,
    };
    const plan = buildShotPlan(input);
    expect(plan.selectedFull.power).toBe(1);
    expect(plan.selected.power).toBeLessThan(1);
    expect(plan.selectedFull.result.totalMetres).toBeGreaterThan(
      plan.selected.result.totalMetres,
    );
  });

  it('aims back toward the cup from beyond the green', () => {
    const start = { x: PIN_POSITION.x, y: PIN_POSITION.y + 25 };
    expect(absoluteAimFromPin(start, 0)).toBeCloseTo(180, 6);
    expect(absoluteAimFromPin(start, 8)).toBeCloseTo(188, 6);
  });

  it('does not include the perfect-contact bonus in rated projections', () => {
    const full = buildShotPlan(planInput).selectedFull.result;
    expect(full.carryBonusMetres).toBe(0);
    expect(full.carryMetres).toBe(CLUBS[0].maxDistanceMetres);
  });

  it('turns projected penalty types into clear pre-shot warnings', () => {
    const water = buildShotPlan({
      ...planInput,
      start: { x: -39, y: 343 },
      startingLie: 'fairway',
      selectedClubIndex: 3,
    }).selectedFull.result;
    expect(penaltyWarning(water)).toBe('WATER');
    expect(penaltyWarning({ ...water, penaltyType: 'outOfBounds' })).toBe(
      'OUT OF BOUNDS',
    );
  });

  it('provides a tolerance range without exposing one exact answer', () => {
    const plan = buildShotPlan({
      ...planInput,
      start: { x: -33, y: 390 },
      startingLie: 'fairway',
      selectedClubIndex: 3,
    });
    expect(plan.selectedLow.power).toBeLessThan(plan.selected.power);
    expect(plan.selectedHigh.power).toBeGreaterThan(plan.selected.power);
    expect(swingStrengthLabel(plan.selected.power)).toMatch(
      /TOUCH|HALF|THREE-QUARTER|STRONG|FULL/,
    );
  });
});
