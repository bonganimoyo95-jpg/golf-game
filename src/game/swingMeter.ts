export const POWER_RISE_PER_SECOND = 0.68;
export const RETURN_BASE_PER_SECOND = 0.6;
export const RETURN_POWER_BONUS_PER_SECOND = 0.58;
export const LATE_CONTACT_LIMIT = -0.5;
export const MINIMUM_SHOT_POWER = 0.15;
export const FULL_ACCURACY_ERROR_DISTANCE = 0.24;

export interface PowerAdvance {
  position: number;
  reachedMaximum: boolean;
}

export interface DownswingAdvance {
  position: number;
  missedContact: boolean;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function advancePowerPosition(position: number, deltaMs: number): PowerAdvance {
  const nextPosition = position + Math.max(0, deltaMs) * 0.001 * POWER_RISE_PER_SECOND;

  return {
    position: Math.min(1, nextPosition),
    reachedMaximum: nextPosition >= 1,
  };
}

export function lockPowerAt(
  position: number,
  minimumPower: number = MINIMUM_SHOT_POWER,
): number {
  return clamp(position, minimumPower, 1);
}

export function returnSpeedForPower(power: number): number {
  const normalizedPower = clamp(power, MINIMUM_SHOT_POWER, 1);
  return RETURN_BASE_PER_SECOND + normalizedPower * RETURN_POWER_BONUS_PER_SECOND;
}

export function advanceDownswingPosition(
  position: number,
  selectedPower: number,
  deltaMs: number,
): DownswingAdvance {
  const nextPosition =
    position - Math.max(0, deltaMs) * 0.001 * returnSpeedForPower(selectedPower);

  return {
    position: Math.max(LATE_CONTACT_LIMIT, nextPosition),
    missedContact: nextPosition <= LATE_CONTACT_LIMIT,
  };
}

export function accuracyErrorAt(position: number): number {
  return clamp(position / FULL_ACCURACY_ERROR_DISTANCE, -1, 1);
}

export function meterAngleForPosition(position: number): number {
  const normalizedPosition = clamp(position, LATE_CONTACT_LIMIT, 1);
  return Math.PI / 2 + normalizedPosition * Math.PI;
}
