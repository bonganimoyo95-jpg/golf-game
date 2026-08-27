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
    // A short putt has roughly triple the timing window of a 25 m putt.
    contactWindow: 0.32 - distanceShare * 0.215,
    meterSpeedMultiplier: 0.47 + distanceShare * 0.2,
    powerBandHalfWidth: 0.052 - distanceShare * 0.032,
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
