export type Lie = 'tee' | 'fairway' | 'rough' | 'bunker' | 'green' | 'water' | 'outOfBounds';

export interface ClubDefinition {
  id: 'driver' | 'iron' | 'wedge' | 'putter';
  name: string;
  shortName: string;
  maxDistanceMetres: number;
  loftDegrees: number;
  peakHeightMetres: number;
  flightSeconds: number;
  baseRolloutMetres: number;
  bounceHeightMetres: number;
  dispersionDegrees: number;
  windSensitivity: number;
  isPutter: boolean;
}

export const CLUBS: readonly ClubDefinition[] = [
  {
    id: 'driver',
    name: 'Driver',
    shortName: 'DRV',
    maxDistanceMetres: 200,
    loftDegrees: 12,
    peakHeightMetres: 28,
    flightSeconds: 2.8,
    baseRolloutMetres: 20,
    bounceHeightMetres: 2.8,
    dispersionDegrees: 11,
    windSensitivity: 0.72,
    isPutter: false,
  },
  {
    id: 'iron',
    name: 'Iron',
    shortName: 'IRON',
    maxDistanceMetres: 140,
    loftDegrees: 27,
    peakHeightMetres: 34,
    flightSeconds: 2.45,
    baseRolloutMetres: 10,
    bounceHeightMetres: 2.2,
    dispersionDegrees: 8,
    windSensitivity: 0.84,
    isPutter: false,
  },
  {
    id: 'wedge',
    name: 'Wedge',
    shortName: 'WDG',
    maxDistanceMetres: 70,
    loftDegrees: 50,
    peakHeightMetres: 38,
    flightSeconds: 2.1,
    baseRolloutMetres: 4,
    bounceHeightMetres: 1.5,
    dispersionDegrees: 6,
    windSensitivity: 1,
    isPutter: false,
  },
  {
    id: 'putter',
    name: 'Putter',
    shortName: 'PT',
    maxDistanceMetres: 25,
    loftDegrees: 0,
    peakHeightMetres: 0,
    flightSeconds: 0,
    baseRolloutMetres: 25,
    bounceHeightMetres: 0,
    dispersionDegrees: 4,
    windSensitivity: 0,
    isPutter: true,
  },
];

export interface LieTuning {
  distanceMultiplier: number;
  dispersionMultiplier: number;
  rolloutMultiplier: number;
  label: string;
}

export const LIE_TUNING: Readonly<Record<Lie, LieTuning>> = {
  tee: {
    distanceMultiplier: 1,
    dispersionMultiplier: 1,
    rolloutMultiplier: 1,
    label: 'TEE',
  },
  fairway: {
    distanceMultiplier: 0.98,
    dispersionMultiplier: 1,
    rolloutMultiplier: 1,
    label: 'FAIRWAY',
  },
  rough: {
    distanceMultiplier: 0.84,
    dispersionMultiplier: 1.28,
    rolloutMultiplier: 0.42,
    label: 'ROUGH',
  },
  bunker: {
    distanceMultiplier: 0.58,
    dispersionMultiplier: 1.42,
    rolloutMultiplier: 0.12,
    label: 'BUNKER',
  },
  green: {
    distanceMultiplier: 1,
    dispersionMultiplier: 0.8,
    rolloutMultiplier: 1.18,
    label: 'GREEN',
  },
  water: {
    distanceMultiplier: 0,
    dispersionMultiplier: 1,
    rolloutMultiplier: 0,
    label: 'WATER',
  },
  outOfBounds: {
    distanceMultiplier: 0,
    dispersionMultiplier: 1,
    rolloutMultiplier: 0,
    label: 'OUT OF BOUNDS',
  },
};

export const PROTOTYPE_HOLE = {
  number: 1,
  name: 'Community Bend',
  par: 4,
  distanceMetres: 392,
  wind: {
    direction: 'NE',
    speed: 7,
    bearingDegrees: 45,
  },
} as const;
