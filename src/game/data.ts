export type Lie = 'tee' | 'fairway' | 'rough' | 'bunker' | 'green' | 'water' | 'outOfBounds';

export interface ClubDefinition {
  id: 'driver' | 'wood3' | 'iron' | 'wedge' | 'putter';
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
  shotStyle?: 'standard' | 'chip' | 'splash';
}

export const CLUBS: readonly ClubDefinition[] = [
  {
    id: 'driver',
    name: 'Driver',
    shortName: 'DRV',
    maxDistanceMetres: 250,
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
    id: 'wood3',
    name: '3 Wood',
    shortName: '3W',
    maxDistanceMetres: 220,
    loftDegrees: 16,
    peakHeightMetres: 26,
    flightSeconds: 2.65,
    baseRolloutMetres: 17,
    bounceHeightMetres: 2.5,
    dispersionDegrees: 9,
    windSensitivity: 0.78,
    isPutter: false,
  },
  {
    id: 'iron',
    name: 'Iron',
    shortName: 'IRON',
    maxDistanceMetres: 165,
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
    maxDistanceMetres: 95,
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
    maxDistanceMetres: 30,
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
  number: 13,
  name: 'Azalea Bend',
  par: 5,
  distanceMetres: 476,
  wind: {
    direction: 'SE',
    speed: 6,
    bearingDegrees: 135,
  },
} as const;
