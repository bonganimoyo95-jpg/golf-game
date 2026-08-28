import { bearingBetween } from './cameraModel';
import {
  PIN_POSITION,
  distanceBetween,
  distanceToPin,
  type WorldPosition,
} from './courseModel';
import type { ClubDefinition, Lie } from './data';
import { recommendedClubIndex } from './gameRules';
import {
  calculateRatedShot,
  putterPowerForDistance,
  type ShotResult,
  type WindDefinition,
} from './physics/shotPhysics';

export const MINIMUM_FULL_SWING_POWER = 0.15;

export interface PlannedClubShot {
  clubIndex: number;
  power: number;
  result: ShotResult;
  cannotReach: boolean;
}

export interface ShotPlan {
  distanceToPinMetres: number;
  directBearingDegrees: number;
  absoluteAimDegrees: number;
  selected: PlannedClubShot;
  selectedFull: PlannedClubShot;
  recommended: PlannedClubShot;
}

export interface ShotPlanInput {
  start: WorldPosition;
  startingLie: Lie;
  clubs: readonly ClubDefinition[];
  selectedClubIndex: number;
  relativeAimDegrees: number;
  wind: WindDefinition;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function absoluteAimFromPin(
  start: WorldPosition,
  relativeAimDegrees: number,
): number {
  return bearingBetween(start, PIN_POSITION) + relativeAimDegrees;
}

function ratedResultAt(
  input: ShotPlanInput,
  clubIndex: number,
  power: number,
): ShotResult {
  return calculateRatedShot({
    start: input.start,
    startingLie: input.startingLie,
    club: input.clubs[clubIndex],
    power,
    accuracyError: 0,
    aimDegrees: absoluteAimFromPin(input.start, input.relativeAimDegrees),
    wind: input.wind,
  });
}

/**
 * Find the meter position whose rated total travel most closely matches the
 * cup distance. It uses the real deterministic shot model, including wind,
 * lie and rollout, but excludes the optional pure-contact bonus.
 */
export function powerForTargetDistance(
  input: ShotPlanInput,
  clubIndex: number,
): number {
  const club = input.clubs[clubIndex];
  const targetDistance = distanceToPin(input.start);
  if (club.isPutter) {
    return putterPowerForDistance(club, targetDistance, input.startingLie);
  }

  let bestPower = MINIMUM_FULL_SWING_POWER;
  let bestDifference = Number.POSITIVE_INFINITY;
  for (let step = 0; step <= 170; step += 1) {
    const power = MINIMUM_FULL_SWING_POWER + (step / 170) * (1 - MINIMUM_FULL_SWING_POWER);
    const result = ratedResultAt(input, clubIndex, power);
    const difference = Math.abs(result.totalMetres - targetDistance);
    if (difference < bestDifference) {
      bestDifference = difference;
      bestPower = power;
    }
  }
  return clamp(bestPower, MINIMUM_FULL_SWING_POWER, 1);
}

function plannedClubShot(
  input: ShotPlanInput,
  clubIndex: number,
  power: number,
): PlannedClubShot {
  const result = ratedResultAt(input, clubIndex, power);
  return {
    clubIndex,
    power,
    result,
    cannotReach:
      power >= 0.995 &&
      distanceBetween(input.start, result.visualEnd) + 1 < distanceToPin(input.start),
  };
}

export function buildShotPlan(input: ShotPlanInput): ShotPlan {
  const recommendedIndex = recommendedClubIndex(
    distanceToPin(input.start),
    input.startingLie,
    input.clubs,
  );
  const selectedPower = powerForTargetDistance(input, input.selectedClubIndex);
  const recommendedPower = powerForTargetDistance(input, recommendedIndex);

  return {
    distanceToPinMetres: distanceToPin(input.start),
    directBearingDegrees: bearingBetween(input.start, PIN_POSITION),
    absoluteAimDegrees: absoluteAimFromPin(input.start, input.relativeAimDegrees),
    selected: plannedClubShot(input, input.selectedClubIndex, selectedPower),
    selectedFull: plannedClubShot(input, input.selectedClubIndex, 1),
    recommended: plannedClubShot(input, recommendedIndex, recommendedPower),
  };
}

export function penaltyWarning(result: ShotResult): string | undefined {
  if (result.penaltyType === 'water') return 'WATER';
  if (result.penaltyType === 'outOfBounds') return 'OUT OF BOUNDS';
  return undefined;
}
