import { PROTOTYPE_HOLE, type Lie } from './data';

export interface WorldPosition {
  x: number;
  y: number;
}

export interface CourseBounds {
  minimumX: number;
  maximumX: number;
  minimumY: number;
  maximumY: number;
}

export interface EllipseSurface {
  id: string;
  lie: Extract<Lie, 'water' | 'green' | 'bunker'>;
  centre: WorldPosition;
  radiusX: number;
  radiusY: number;
}

export interface TeeSurface {
  id: 'back' | 'forward';
  centre: WorldPosition;
  halfWidth: number;
  halfDepth: number;
}

export const COURSE_DEFINITION = {
  id: 'community-bend',
  bounds: {
    minimumX: -74,
    maximumX: 74,
    minimumY: -8,
    maximumY: 414,
  } satisfies CourseBounds,
  pin: { x: 0, y: PROTOTYPE_HOLE.distanceMetres } satisfies WorldPosition,
  tees: [
    {
      id: 'back',
      centre: { x: 0, y: 0 },
      halfWidth: 16,
      halfDepth: 8,
    },
    {
      id: 'forward',
      centre: { x: 0, y: 42 },
      halfWidth: 16,
      halfDepth: 8,
    },
  ] satisfies readonly TeeSurface[],
  surfaces: [
    {
      id: 'left-lake',
      lie: 'water',
      centre: { x: -53, y: 176 },
      radiusX: 24,
      radiusY: 92,
    },
    {
      id: 'right-lake',
      lie: 'water',
      centre: { x: 55, y: 245 },
      radiusX: 18,
      radiusY: 72,
    },
    {
      id: 'green',
      lie: 'green',
      centre: { x: 0, y: PROTOTYPE_HOLE.distanceMetres },
      radiusX: 29,
      radiusY: 19,
    },
    {
      id: 'left-green-bunker',
      lie: 'bunker',
      centre: { x: -15, y: 377 },
      radiusX: 12,
      radiusY: 16,
    },
    {
      id: 'right-green-bunker',
      lie: 'bunker',
      centre: { x: 17, y: 376 },
      radiusX: 12,
      radiusY: 15,
    },
  ] satisfies readonly EllipseSurface[],
} as const;

export const BACK_TEE_POSITION: Readonly<WorldPosition> = {
  ...COURSE_DEFINITION.tees[0].centre,
};
export const FRONT_TEE_POSITION: Readonly<WorldPosition> = {
  ...COURSE_DEFINITION.tees[1].centre,
};
export const PIN_POSITION: Readonly<WorldPosition> = {
  ...COURSE_DEFINITION.pin,
};

export function insideEllipse(
  position: WorldPosition,
  surface: Pick<EllipseSurface, 'centre' | 'radiusX' | 'radiusY'>,
): boolean {
  const x = (position.x - surface.centre.x) / surface.radiusX;
  const y = (position.y - surface.centre.y) / surface.radiusY;
  return x * x + y * y <= 1;
}

export function fairwayCentreAt(y: number): number {
  const progress = Math.max(0, Math.min(1, y / PROTOTYPE_HOLE.distanceMetres));
  return Math.sin(progress * Math.PI * 1.25) * 8;
}

export function fairwayHalfWidthAt(y: number): number {
  const progress = Math.max(0, Math.min(1, y / PROTOTYPE_HOLE.distanceMetres));
  return 23 + Math.sin(progress * Math.PI) * 12;
}

export function sampleFairway(stepMetres = 12): Array<{
  y: number;
  left: WorldPosition;
  right: WorldPosition;
}> {
  const samples: Array<{
    y: number;
    left: WorldPosition;
    right: WorldPosition;
  }> = [];
  const start = COURSE_DEFINITION.bounds.minimumY;
  const end = COURSE_DEFINITION.pin.y;

  for (let y = start; y < end; y += stepMetres) {
    const centre = fairwayCentreAt(y);
    const halfWidth = fairwayHalfWidthAt(y);
    samples.push({
      y,
      left: { x: centre - halfWidth, y },
      right: { x: centre + halfWidth, y },
    });
  }

  const centre = fairwayCentreAt(end);
  const halfWidth = fairwayHalfWidthAt(end);
  samples.push({
    y: end,
    left: { x: centre - halfWidth, y: end },
    right: { x: centre + halfWidth, y: end },
  });
  return samples;
}
