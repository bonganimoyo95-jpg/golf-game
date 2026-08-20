import type { ClubDefinition, Lie } from './data';

const CLUBS_BY_LIE: Readonly<Record<Lie, readonly number[]>> = {
  tee: [0, 1, 2],
  fairway: [1, 2],
  rough: [1, 2],
  bunker: [1, 2],
  green: [3],
  water: [1, 2],
  outOfBounds: [1, 2],
};

export function allowedClubIndices(lie: Lie): readonly number[] {
  return CLUBS_BY_LIE[lie];
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

  const wedgeIndex = allowed.find((index) => clubs[index].id === 'wedge');
  if (
    wedgeIndex !== undefined &&
    distanceMetres <= clubs[wedgeIndex].maxDistanceMetres * 0.92
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

  return allowed[0];
}
