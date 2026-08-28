import type { Lie } from './data';

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
  id: 'azalea-bend',
  bounds: {
    minimumX: -110,
    maximumX: 90,
    minimumY: -10,
    // Keep a playable recovery apron behind the green. A shot that finishes
    // beyond the pin should remain visible and playable unless it crosses a
    // genuinely authored lateral boundary.
    maximumY: 550,
  } satisfies CourseBounds,
  // The displayed distance follows the intended playing route. The direct
  // tee-to-pin line is deliberately shorter so a bold line around the corner
  // can challenge the creek in two shots.
  pin: { x: -33, y: 470 } satisfies WorldPosition,
  tees: [
    {
      id: 'back',
      centre: { x: 38, y: 0 },
      halfWidth: 14,
      halfDepth: 8,
    },
    {
      id: 'forward',
      centre: { x: 34, y: 42 },
      halfWidth: 14,
      halfDepth: 8,
    },
  ] satisfies readonly TeeSurface[],
  surfaces: [
    {
      id: 'inside-creek-lower',
      lie: 'water',
      centre: { x: -72, y: 314 },
      radiusX: 10,
      radiusY: 100,
    },
    {
      id: 'inside-creek-turn',
      lie: 'water',
      centre: { x: -67, y: 397 },
      radiusX: 15,
      radiusY: 58,
    },
    {
      id: 'front-creek-west',
      lie: 'water',
      centre: { x: -59, y: 438 },
      radiusX: 35,
      radiusY: 13,
    },
    {
      id: 'front-creek-centre',
      lie: 'water',
      centre: { x: -26, y: 440 },
      radiusX: 32,
      radiusY: 11,
    },
    {
      id: 'front-creek-east',
      lie: 'water',
      centre: { x: 5, y: 438 },
      radiusX: 28,
      radiusY: 10,
    },
    {
      id: 'green',
      lie: 'green',
      centre: { x: -33, y: 470 },
      radiusX: 30,
      radiusY: 18,
    },
    {
      id: 'back-left-bunker',
      lie: 'bunker',
      centre: { x: -59, y: 485 },
      radiusX: 13,
      radiusY: 8,
    },
    {
      id: 'back-centre-bunker',
      lie: 'bunker',
      centre: { x: -30, y: 490 },
      radiusX: 12,
      radiusY: 7,
    },
    {
      id: 'back-right-bunker',
      lie: 'bunker',
      centre: { x: -2, y: 484 },
      radiusX: 14,
      radiusY: 8,
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
  const smoothStep = (value: number): number => {
    const clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * (3 - 2 * clamped);
  };
  const openingMove = smoothStep((y - 80) / 230);
  const cornerMove = smoothStep((y - 220) / 170);
  const greenReturn = smoothStep((y - 390) / 80);
  return 38 - openingMove * 18 - cornerMove * 62 + greenReturn * 9;
}

export function fairwayHalfWidthAt(y: number): number {
  const progress = Math.max(0, Math.min(1, y / COURSE_DEFINITION.pin.y));
  const cornerPinch = Math.exp(-Math.pow((progress - 0.74) / 0.12, 2));
  return 23 + Math.sin(progress * Math.PI) * 9 - cornerPinch * 5;
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
