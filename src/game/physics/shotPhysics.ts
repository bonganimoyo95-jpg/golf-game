import { LIE_TUNING, type ClubDefinition, type Lie } from '../data';
import {
  PIN_POSITION,
  distanceBetween,
  getLieAt,
  isPenaltyLie,
  type WorldPosition,
} from '../courseModel';
import { evaluateCupCapture } from '../cupCapture';
import { minimumPowerForClub } from '../shortGame';

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
  contactQuality: number;
  carryBonusMetres: number;
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
export const PURE_CONTACT_WINDOW = 0.12;
export const MAX_PURE_CONTACT_CARRY_BONUS = 0.03;

export function contactQualityForAccuracy(accuracyErrorValue: number): number {
  const accuracyError = Math.abs(clamp(accuracyErrorValue, -1, 1));
  const proximity = clamp(1 - accuracyError / PURE_CONTACT_WINDOW, 0, 1);
  return proximity * proximity * (3 - 2 * proximity);
}

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
  visualEnd: WorldPosition;
  finalLie: Lie;
  resolvedEnd: WorldPosition;
  resolvedLie: Lie;
  penaltyType?: 'water' | 'outOfBounds';
  penaltyEntry?: WorldPosition;
  dropPosition?: WorldPosition;
}

interface SegmentPenalty {
  type: 'water' | 'outOfBounds';
  entry: WorldPosition;
  lastSafe: WorldPosition;
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

function firstPenaltyAlongGround(
  start: WorldPosition,
  end: WorldPosition,
): SegmentPenalty | undefined {
  const segmentMetres = distanceBetween(start, end);
  if (segmentMetres < 0.01) return undefined;
  const samples = Math.max(48, Math.ceil(segmentMetres * 4));
  let lastSafe = { ...start };

  for (let index = 1; index <= samples; index += 1) {
    const point = pointBetween(start, end, index / samples);
    const lie = getLieAt(point);
    if (lie === 'water' || lie === 'outOfBounds') {
      return { type: lie, entry: point, lastSafe };
    }
    lastSafe = point;
  }

  return undefined;
}

function resolvePenalty(
  start: WorldPosition,
  carryEnd: WorldPosition,
  visualEnd: WorldPosition,
  landingLie: Lie,
  finalLie: Lie,
): PenaltyResolution {
  if (landingLie === 'water') {
    const water = waterDropAlongSegment(start, carryEnd);
    const dropPosition = water.dropPosition ?? start;
    const resolvedLie = getLieAt(dropPosition);

    return {
      // The ball visibly lands where the flight ends. The separately recorded
      // margin crossing determines the legal drop and penalty explanation.
      visualEnd: { ...carryEnd },
      finalLie: 'water',
      resolvedEnd: { ...dropPosition },
      resolvedLie: isPenaltyLie(resolvedLie) ? getLieAt(start) : resolvedLie,
      penaltyType: 'water',
      penaltyEntry: water.penaltyEntry,
      dropPosition: { ...dropPosition },
    };
  }

  if (landingLie === 'outOfBounds') {
    return {
      visualEnd: { ...carryEnd },
      finalLie: 'outOfBounds',
      resolvedEnd: { ...start },
      resolvedLie: getLieAt(start),
      penaltyType: 'outOfBounds',
      penaltyEntry: { ...carryEnd },
    };
  }

  // A ball is allowed to fly over a hazard, but once it lands every metre of
  // bounce and rollout is live. Sampling the complete ground segment prevents
  // a fast ball from crossing a narrow creek or boundary between frames.
  const groundPenalty = firstPenaltyAlongGround(carryEnd, visualEnd);
  if (groundPenalty?.type === 'water') {
    const resolvedLie = getLieAt(groundPenalty.lastSafe);
    return {
      visualEnd: { ...groundPenalty.entry },
      finalLie: 'water',
      resolvedEnd: { ...groundPenalty.lastSafe },
      resolvedLie: isPenaltyLie(resolvedLie) ? getLieAt(start) : resolvedLie,
      penaltyType: 'water',
      penaltyEntry: { ...groundPenalty.entry },
      dropPosition: { ...groundPenalty.lastSafe },
    };
  }

  if (groundPenalty?.type === 'outOfBounds') {
    return {
      visualEnd: { ...groundPenalty.entry },
      finalLie: 'outOfBounds',
      resolvedEnd: { ...start },
      resolvedLie: getLieAt(start),
      penaltyType: 'outOfBounds',
      penaltyEntry: { ...groundPenalty.entry },
    };
  }

  return {
    visualEnd: { ...visualEnd },
    finalLie,
    resolvedEnd: { ...visualEnd },
    resolvedLie: finalLie,
  };
}

function calculateShotWithContactBonus(
  input: ShotInput,
  applyContactBonus: boolean,
): ShotResult {
  const power = clamp(input.power, minimumPowerForClub(input.club), 1);
  const accuracyError = clamp(input.accuracyError, -1, 1);
  const contactQuality = contactQualityForAccuracy(accuracyError);
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
    const plannedVisualEnd = cupCapture.holed ? { ...PIN_POSITION } : plannedEnd;
    const plannedFinalLie = getLieAt(plannedVisualEnd);
    const penaltyResolution = resolvePenalty(
      input.start,
      input.start,
      plannedVisualEnd,
      input.startingLie,
      plannedFinalLie,
    );
    const visualEnd = penaltyResolution.visualEnd;
    const finalLie = penaltyResolution.finalLie;
    const rolloutMetres = distanceBetween(input.start, visualEnd);
    const penalty = penaltyResolution.penaltyType !== undefined;

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
      contactQuality,
      carryBonusMetres: 0,
      aimDegrees: input.aimDegrees,
      launchDirectionDegrees,
      peakHeightMetres: 0,
      animationDurationMs: Math.round(850 + rolloutMetres * 14),
      penalty,
      penaltyType: penaltyResolution.penaltyType,
      penaltyEntry: penaltyResolution.penaltyEntry,
      dropPosition: penaltyResolution.dropPosition,
      resolvedLie: penaltyResolution.resolvedLie,
      holed: cupCapture.holed && !penalty,
      strokeCost: penalty ? 2 : 1,
      club: input.club,
    };
  }

  const shortGameShot =
    input.club.shotStyle === 'chip' || input.club.shotStyle === 'splash';
  const powerDistanceScale = shortGameShot
    ? 0.06 + Math.pow(power, 1.15) * 0.94
    : 0.32 + power * 0.68;
  const carryWithoutContactBonus =
    input.club.maxDistanceMetres * powerDistanceScale * lieTuning.distanceMultiplier;
  const carryBonusMetres = applyContactBonus
    ? carryWithoutContactBonus * MAX_PURE_CONTACT_CARRY_BONUS * contactQuality
    : 0;
  const carryMetres = carryWithoutContactBonus + carryBonusMetres;
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
  const plannedVisualEnd = addScaled(
    carryEnd,
    shotDirection,
    rolloutMetres,
    { x: 0, y: 0 },
    0,
  );
  const plannedFinalLie = isPenaltyLie(landingLie)
    ? landingLie
    : getLieAt(plannedVisualEnd);
  const penaltyResolution = resolvePenalty(
    input.start,
    carryEnd,
    plannedVisualEnd,
    landingLie,
    plannedFinalLie,
  );
  const visualEnd = penaltyResolution.visualEnd;
  const finalLie = penaltyResolution.finalLie;
  const resolvedRolloutMetres = distanceBetween(carryEnd, visualEnd);
  const penalty = penaltyResolution.penaltyType !== undefined;

  return {
    start: { ...input.start },
    carryEnd,
    visualEnd,
    resolvedEnd: penaltyResolution.resolvedEnd,
    startingLie: input.startingLie,
    landingLie,
    finalLie,
    carryMetres,
    rolloutMetres: resolvedRolloutMetres,
    totalMetres: distanceBetween(input.start, visualEnd),
    power,
    accuracyError,
    contactQuality,
    carryBonusMetres,
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

/**
 * Resolves a real strike, including the smoothly tapered pure-contact bonus.
 */
export function calculateShot(input: ShotInput): ShotResult {
  return calculateShotWithContactBonus(input, true);
}

/**
 * Resolves a pre-shot projection at the club's rated distance. Planning
 * graphics must not promise the optional three-percent perfect-contact bonus.
 */
export function calculateRatedShot(input: ShotInput): ShotResult {
  return calculateShotWithContactBonus(input, false);
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

  const flightShare = result.club.id === 'wedge' ? 0.8 : 0.76;
  if (progress <= flightShare) {
    const flightProgress = progress / flightShare;
    const apexProgress = clamp(
      0.43 + result.club.loftDegrees * 0.0022,
      0.44,
      0.55,
    );
    const heightShare =
      flightProgress <= apexProgress
        ? Math.sin((flightProgress / apexProgress) * (Math.PI / 2))
        : Math.cos(
            ((flightProgress - apexProgress) / (1 - apexProgress)) *
              (Math.PI / 2),
          );
    return {
      x: result.start.x + (result.carryEnd.x - result.start.x) * flightProgress,
      y: result.start.y + (result.carryEnd.y - result.start.y) * flightProgress,
      height: Math.max(0, heightShare) * result.peakHeightMetres,
      phase: 'flight',
    };
  }

  const groundProgress = (progress - flightShare) / (1 - flightShare);
  const bounceEnvelope = Math.max(0, 1 - groundProgress * 1.5);
  const bounceHeight =
    Math.abs(Math.sin(groundProgress * Math.PI * 2.65)) *
    result.club.bounceHeightMetres *
    bounceEnvelope;

  return {
    x: result.carryEnd.x + (result.visualEnd.x - result.carryEnd.x) * groundProgress,
    y: result.carryEnd.y + (result.visualEnd.y - result.carryEnd.y) * groundProgress,
    height: bounceHeight,
    phase: bounceHeight > 0.08 ? 'bounce' : 'roll',
  };
}
