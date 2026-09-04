import { CLUBS, type ClubDefinition, type Lie } from './data';

type ClubId = ClubDefinition['id'];

const CLUBS_BY_LIE: Readonly<Record<Lie, readonly ClubId[]>> = {
  tee: ['driver', 'wood3', 'iron', 'wedge'],
  fairway: ['wood3', 'iron', 'wedge'],
  rough: ['wood3', 'iron', 'wedge'],
  bunker: ['iron', 'wedge'],
  green: ['putter'],
  water: ['wood3', 'iron', 'wedge'],
  outOfBounds: ['wood3', 'iron', 'wedge'],
};

export function allowedClubIndices(lie: Lie): readonly number[] {
  const allowedIds = CLUBS_BY_LIE[lie];
  return CLUBS.map((club, index) => ({ club, index }))
    .filter(({ club }) => allowedIds.includes(club.id))
    .map(({ index }) => index);
}

export function nextAllowedClubIndex(
  currentIndex: number,
  direction: number,
  lie: Lie,
): number {
  const allowed = allowedClubIndices(lie);
  const currentPosition = Math.max(0, allowed.indexOf(currentIndex));
  const nextPosition = ((currentPosition + direction) % allowed.length + allowed.length) % allowed.length;
  return allowed[nextPosition];
}

export function recommendedClubIndex(
  distanceMetres: number,
  lie: Lie,
  clubs: readonly ClubDefinition[],
): number {
  const allowed = allowedClubIndices(lie);
  if (allowed.length === 1) return allowed[0];

  const driverIndex = allowed.find((index) => clubs[index].id === 'driver');
  const woodIndex = allowed.find((index) => clubs[index].id === 'wood3');
  if (
    driverIndex !== undefined &&
    (woodIndex === undefined || distanceMetres > clubs[woodIndex].maxDistanceMetres)
  ) {
    return driverIndex;
  }

  const wedgeIndex = allowed.find((index) => clubs[index].id === 'wedge');
  const wedgeRecommendationScale =
    wedgeIndex !== undefined &&
    (clubs[wedgeIndex].shotStyle === 'chip' ||
      clubs[wedgeIndex].shotStyle === 'splash')
      ? 1.05
      : 0.92;
  if (
    wedgeIndex !== undefined &&
    distanceMetres <= clubs[wedgeIndex].maxDistanceMetres * wedgeRecommendationScale
  ) {
    return wedgeIndex;
  }

  const ironIndex = allowed.find((index) => clubs[index].id === 'iron');
  if (
    ironIndex !== undefined &&
    distanceMetres <= clubs[ironIndex].maxDistanceMetres * 1.05
  ) {
    return ironIndex;
  }

  if (woodIndex !== undefined) return woodIndex;

  return allowed[0];
}
