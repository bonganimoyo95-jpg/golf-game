export interface ClubDefinition {
  name: string;
  shortName: string;
  maxDistanceMetres: number;
}

export const CLUBS: readonly ClubDefinition[] = [
  { name: 'Driver', shortName: 'DRV', maxDistanceMetres: 200 },
  { name: 'Iron', shortName: 'IRON', maxDistanceMetres: 140 },
  { name: 'Wedge', shortName: 'WDG', maxDistanceMetres: 70 },
  { name: 'Putter', shortName: 'PT', maxDistanceMetres: 25 },
];

export const PROTOTYPE_HOLE = {
  number: 1,
  name: 'Community Bend',
  par: 4,
  distanceMetres: 392,
  wind: {
    direction: 'NE',
    speed: 7,
  },
} as const;
