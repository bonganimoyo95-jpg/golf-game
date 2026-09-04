import { accuracyErrorAt } from './swingMeter';

export interface PuttingDifficulty {
  contactWindow: number;
  meterSpeedMultiplier: number;
  powerBandHalfWidth: number;
  label: 'FORGIVING' | 'STANDARD' | 'PRECISION';
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothStep(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function puttingDifficultyForDistance(
  distanceMetres: number,
): PuttingDifficulty {
  const distanceShare = smoothStep((distanceMetres - 2) / 23);
  const label =
    distanceMetres <= 6
      ? 'FORGIVING'
      : distanceMetres <= 14
        ? 'STANDARD'
        : 'PRECISION';

  return {
    // One launch difficulty: short putts remain readable, while a long putt
    // demands meaningfully cleaner power and contact than the old friendly tune.
    contactWindow: 0.28 - distanceShare * 0.2,
    meterSpeedMultiplier: 0.5 + distanceShare * 0.26,
    powerBandHalfWidth: 0.045 - distanceShare * 0.03,
    label,
  };
}

export function puttingAccuracyErrorAt(
  meterPosition: number,
  distanceMetres: number,
): number {
  return accuracyErrorAt(
    meterPosition,
    puttingDifficultyForDistance(distanceMetres).contactWindow,
  );
}
