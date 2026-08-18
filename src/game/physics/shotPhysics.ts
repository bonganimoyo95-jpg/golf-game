import { LIE_TUNING, type ClubDefinition, type Lie } from '../data';
import {
  PIN_POSITION,
  distanceBetween,
  getLieAt,
  isPenaltyLie,
  type WorldPosition,
} from '../courseModel';
import { evaluateCupCapture } from '../cupCapture';

export interface WindDefinition {
  speed: number;
  bearingDegrees: number;
}

export interface ShotInput {
  start: WorldPosition;
  club: ClubDefinition;
  power: number;
  accuracyError: number;
  aimDegrees: number;
  wind: WindDefinition;
  startingLie: Lie;
}

export interface ShotResult {
  start: WorldPosition;
  carryEnd: WorldPosition;
  visualEnd: WorldPosition;
  resolvedEnd: WorldPosition;
  startingLie: Lie;
  landingLie: Lie;
  finalLie: Lie;
  carryMetres: number;
  rolloutMetres: number;
  totalMetres: number;
  power: number;
  accuracyError: number;
  aimDegrees: number;
  launchDirectionDegrees: number;
  peakHeightMetres: number;
  animationDurationMs: number;
  penalty: boolean;
  penaltyType?: 'water' | 'outOfBounds';
  penaltyEntry?: WorldPosition;
  dropPosition?: WorldPosition;
  resolvedLie: Lie;
  holed: boolean;
  strokeCost: number;
  club: ClubDefinition;
}

export interface TrajectoryPoint extends WorldPosition {
  height: number;
  phase: 'flight' | 'bounce' | 'roll';
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

const PUTT_STARTING_DISTANCE_SHARE = 0.01;
const PUTT_POWER_DISTANCE_SHARE = 0.99;
const PUTT_POWER_EXPONENT = 1.55;

export function putterRolloutForPower(
  club: ClubDefinition,
  powerValue: number,
  startingLie: Lie,
): number {
  const power = clamp(powerValue, 0.03, 1);
  const lieTuning = LIE_TUNING[startingLie];
  return (
    club.maxDistanceMetres *
    (PUTT_STARTING_DISTANCE_SHARE +
      Math.pow(power, PUTT_POWER_EXPONENT) * PUTT_POWER_DISTANCE_SHARE) *
    lieTuning.distanceMultiplier *
    lieTuning.rolloutMultiplier
  );
}

export function putterPowerForDistance(
  club: ClubDefinition,
  distanceMetres: number,
  startingLie: Lie,
): number {
  const lieTuning = LIE_TUNING[startingLie];
  const maximumDistance =
    club.maxDistanceMetres *
    lieTuning.distanceMultiplier *
    lieTuning.rolloutMultiplier;
  const distanceShare = clamp(distanceMetres / Math.max(maximumDistance, 0.01), 0, 1);
  const poweredShare = clamp(
    (distanceShare - PUTT_STARTING_DISTANCE_SHARE) / PUTT_POWER_DISTANCE_SHARE,
    0,
    1,
  );
  return clamp(Math.pow(poweredShare, 1 / PUTT_POWER_EXPONENT), 0.03, 1);
}

function directionVector(degrees: number): WorldPosition {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: Math.sin(radians),
    y: Math.cos(radians),
  };
}

function addScaled(
  start: WorldPosition,
  primary: WorldPosition,
  primaryScale: number,
  secondary: WorldPosition,
  secondaryScale: number,
): WorldPosition {
  return {
    x: start.x + primary.x * primaryScale + secondary.x * secondaryScale,
    y: start.y + primary.y * primaryScale + secondary.y * secondaryScale,
  };
}

interface PenaltyResolution {
  resolvedEnd: WorldPosition;
  resolvedLie: Lie;
  penaltyType?: 'water' | 'outOfBounds';
  penaltyEntry?: WorldPosition;
  dropPosition?: WorldPosition;
}

function pointBetween(
  start: WorldPosition,
  end: WorldPosition,
  progress: number,
): WorldPosition {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

function waterDropAlongSegment(
  start: WorldPosition,
  end: WorldPosition,
): Pick<PenaltyResolution, 'penaltyEntry' | 'dropPosition'> {
  const segmentMetres = Math.max(0.01, distanceBetween(start, end));
  const samples = Math.max(48, Math.ceil(segmentMetres * 2));
  let lastSafe = { ...start };

  for (let index = 1; index <= samples; index += 1) {
    const progress = index / samples;
    const point = pointBetween(start, end, progress);
    if (getLieAt(point) === 'water') {
      const backoffProgress = Math.max(0, progress - 1 / segmentMetres);
      const backedOff = pointBetween(start, end, backoffProgress);
      const dropPosition = getLieAt(backedOff) === 'water' ? lastSafe : backedOff;
      return {
        penaltyEntry: point,
        dropPosition,
      };
    }
    lastSafe = point;
  }

  return {
    penaltyEntry: { ...end },
    dropPosition: { ...start },
  };
}

function resolvePenalty(
  start: WorldPosition,
  carryEnd: WorldPosition,
  visualEnd: WorldPosition,
  landingLie: Lie,
  finalLie: Lie,
): PenaltyResolution {
  if (landingLie === 'water' || finalLie === 'water') {
    const segmentStart = landingLie === 'water' ? start : carryEnd;
    const segmentEnd = landingLie === 'water' ? carryEnd : visualEnd;
    const water = waterDropAlongSegment(segmentStart, segmentEnd);
    const dropPosition = water.dropPosition ?? start;
    const resolvedLie = getLieAt(dropPosition);

    return {
      resolvedEnd: { ...dropPosition },
      resolvedLie: isPenaltyLie(resolvedLie) ? getLieAt(start) : resolvedLie,
      penaltyType: 'water',
      penaltyEntry: water.penaltyEntry,
      dropPosition: { ...dropPosition },
    };
  }

  if (landingLie === 'outOfBounds' || finalLie === 'outOfBounds') {
    return {
      resolvedEnd: { ...start },
      resolvedLie: getLieAt(start),
      penaltyType: 'outOfBounds',
    };
  }

  return {
    resolvedEnd: { ...visualEnd },
    resolvedLie: finalLie,
  };
}

export function calculateShot(input: ShotInput): ShotResult {
  const power = clamp(input.power, input.club.isPutter ? 0.03 : 0.15, 1);
  const accuracyError = clamp(input.accuracyError, -1, 1);
  const lieTuning = LIE_TUNING[input.startingLie];
  const launchDirectionDegrees =
    input.aimDegrees +
    accuracyError * input.club.dispersionDegrees * lieTuning.dispersionMultiplier;
  const shotDirection = directionVector(launchDirectionDegrees);

  if (input.club.isPutter) {
    const plannedRolloutMetres = putterRolloutForPower(
      input.club,
      power,
      input.startingLie,
    );
    const plannedEnd = addScaled(
      input.start,
      shotDirection,
      plannedRolloutMetres,
      { x: 0, y: 0 },
      0,
    );
    const cupCapture = evaluateCupCapture(input.start, plannedEnd, PIN_POSITION);
    const visualEnd = cupCapture.holed ? { ...PIN_POSITION } : plannedEnd;
    const rolloutMetres = distanceBetween(input.start, visualEnd);
    const finalLie = getLieAt(visualEnd);
    const penalty = isPenaltyLie(finalLie);
    const penaltyResolution = resolvePenalty(
      input.start,
      input.start,
      visualEnd,
      input.startingLie,
      finalLie,
    );

    return {
      start: { ...input.start },
      carryEnd: { ...input.start },
      visualEnd,
      resolvedEnd: penaltyResolution.resolvedEnd,
      startingLie: input.startingLie,
      landingLie: input.startingLie,
      finalLie,
      carryMetres: 0,
      rolloutMetres,
      totalMetres: distanceBetween(input.start, visualEnd),
      power,
      accuracyError,
      aimDegrees: input.aimDegrees,
      launchDirectionDegrees,
      peakHeightMetres: 0,
      animationDurationMs: Math.round(850 + rolloutMetres * 14),
      penalty,
      penaltyType: penaltyResolution.penaltyType,
      penaltyEntry: penaltyResolution.penaltyEntry,
      dropPosition: penaltyResolution.dropPosition,
      resolvedLie: penaltyResolution.resolvedLie,
      holed: cupCapture.holed,
      strokeCost: penalty ? 2 : 1,
      club: input.club,
    };
  }

  const powerDistanceScale = 0.32 + power * 0.68;
  const carryMetres =
    input.club.maxDistanceMetres * powerDistanceScale * lieTuning.distanceMultiplier;
  const flightSeconds = input.club.flightSeconds * (0.72 + power * 0.28);
  const windDirection = directionVector(input.wind.bearingDegrees);
  const windDriftMetres =
    (input.wind.speed / 3.6) * flightSeconds * input.club.windSensitivity;
  const carryEnd = addScaled(
    input.start,
    shotDirection,
    carryMetres,
    windDirection,
    windDriftMetres,
  );
  const landingLie = getLieAt(carryEnd);
  const landingTuning = LIE_TUNING[landingLie];
  const rolloutMetres =
    input.club.baseRolloutMetres *
    (0.35 + power * 0.65) *
    landingTuning.rolloutMultiplier;
  const visualEnd = addScaled(carryEnd, shotDirection, rolloutMetres, { x: 0, y: 0 }, 0);
  const finalLie = isPenaltyLie(landingLie) ? landingLie : getLieAt(visualEnd);
  const penalty = isPenaltyLie(landingLie) || isPenaltyLie(finalLie);
  const penaltyResolution = resolvePenalty(
    input.start,
    carryEnd,
    visualEnd,
    landingLie,
    finalLie,
  );

  return {
    start: { ...input.start },
    carryEnd,
    visualEnd,
    resolvedEnd: penaltyResolution.resolvedEnd,
    startingLie: input.startingLie,
    landingLie,
    finalLie,
    carryMetres,
    rolloutMetres,
    totalMetres: distanceBetween(input.start, visualEnd),
    power,
    accuracyError,
    aimDegrees: input.aimDegrees,
    launchDirectionDegrees,
    peakHeightMetres: input.club.peakHeightMetres * (0.55 + power * 0.45),
    animationDurationMs: Math.round((flightSeconds + 0.8) * 560),
    penalty,
    penaltyType: penaltyResolution.penaltyType,
    penaltyEntry: penaltyResolution.penaltyEntry,
    dropPosition: penaltyResolution.dropPosition,
    resolvedLie: penaltyResolution.resolvedLie,
    holed: false,
    strokeCost: penalty ? 2 : 1,
    club: input.club,
  };
}

export function sampleTrajectory(result: ShotResult, progressValue: number): TrajectoryPoint {
  const progress = clamp(progressValue, 0, 1);

  if (result.club.isPutter) {
    return {
      x: result.start.x + (result.visualEnd.x - result.start.x) * progress,
      y: result.start.y + (result.visualEnd.y - result.start.y) * progress,
      height: 0,
      phase: 'roll',
    };
  }

  const flightShare = 0.7;
  if (progress <= flightShare) {
    const flightProgress = progress / flightShare;
    return {
      x: result.start.x + (result.carryEnd.x - result.start.x) * flightProgress,
      y: result.start.y + (result.carryEnd.y - result.start.y) * flightProgress,
      height: Math.sin(flightProgress * Math.PI) * result.peakHeightMetres,
      phase: 'flight',
    };
  }

  const groundProgress = (progress - flightShare) / (1 - flightShare);
  const bounceEnvelope = Math.max(0, 1 - groundProgress * 1.35);
  const bounceHeight =
    Math.abs(Math.sin(groundProgress * Math.PI * 3)) *
    result.club.bounceHeightMetres *
    bounceEnvelope;

  return {
    x: result.carryEnd.x + (result.visualEnd.x - result.carryEnd.x) * groundProgress,
    y: result.carryEnd.y + (result.visualEnd.y - result.carryEnd.y) * groundProgress,
    height: bounceHeight,
    phase: bounceHeight > 0.08 ? 'bounce' : 'roll',
  };
}
