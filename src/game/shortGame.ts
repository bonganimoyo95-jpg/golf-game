import type { ClubDefinition, Lie } from './data';

export const AUTO_CHIP_DISTANCE_METRES = 45;

const CHIP: Readonly<ClubDefinition> = {
  id: 'wedge',
  name: 'Chip',
  shortName: 'CHIP',
  maxDistanceMetres: 44,
  loftDegrees: 32,
  peakHeightMetres: 7,
  flightSeconds: 1.2,
  baseRolloutMetres: 6,
  bounceHeightMetres: 0.65,
  dispersionDegrees: 5.5,
  windSensitivity: 0.34,
  isPutter: false,
  shotStyle: 'chip',
};

const SPLASH: Readonly<ClubDefinition> = {
  id: 'wedge',
  name: 'Splash',
  shortName: 'SPLASH',
  maxDistanceMetres: 55,
  loftDegrees: 58,
  peakHeightMetres: 18,
  flightSeconds: 1.5,
  baseRolloutMetres: 2.5,
  bounceHeightMetres: 0.45,
  dispersionDegrees: 7,
  windSensitivity: 0.3,
  isPutter: false,
  shotStyle: 'splash',
};

export function effectiveClubForShot(
  club: ClubDefinition,
  distanceMetres: number,
  lie: Lie,
): ClubDefinition {
  if (
    club.id !== 'wedge' ||
    lie === 'green' ||
    distanceMetres > AUTO_CHIP_DISTANCE_METRES
  ) {
    return { ...club, shotStyle: club.shotStyle ?? 'standard' };
  }

  return lie === 'bunker' ? { ...SPLASH } : { ...CHIP };
}

export function minimumPowerForClub(club: ClubDefinition): number {
  if (club.isPutter) return 0.03;
  return club.shotStyle === 'chip' || club.shotStyle === 'splash' ? 0.05 : 0.15;
}
