import { LIE_TUNING, PROTOTYPE_HOLE, type Lie } from './data';
import type { GolferGender } from './playerProfile';

export interface WorldPosition {
  x: number;
  y: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export const BACK_TEE_POSITION: Readonly<WorldPosition> = { x: 0, y: 0 };
export const FRONT_TEE_POSITION: Readonly<WorldPosition> = { x: 0, y: 42 };
export const TEE_POSITION = BACK_TEE_POSITION;
export const PIN_POSITION: Readonly<WorldPosition> = {
  x: 0,
  y: PROTOTYPE_HOLE.distanceMetres,
};

const MAP_CENTRE_X = 176;
const MAP_TEE_Y = 177;
const MAP_PIN_Y = 64;
const MAP_LATERAL_METRES = 74;
const MAP_LATERAL_PIXELS = 145;

function insideEllipse(
  position: WorldPosition,
  centre: WorldPosition,
  radiusX: number,
  radiusY: number,
): boolean {
  const x = (position.x - centre.x) / radiusX;
  const y = (position.y - centre.y) / radiusY;
  return x * x + y * y <= 1;
}

function fairwayCentre(y: number): number {
  const progress = Math.max(0, Math.min(1, y / PROTOTYPE_HOLE.distanceMetres));
  return Math.sin(progress * Math.PI * 1.25) * 8;
}

function fairwayHalfWidth(y: number): number {
  const progress = Math.max(0, Math.min(1, y / PROTOTYPE_HOLE.distanceMetres));
  return 23 + Math.sin(progress * Math.PI) * 12;
}

export function getLieAt(position: WorldPosition): Lie {
  if (position.x < -74 || position.x > 74 || position.y < -8 || position.y > 414) {
    return 'outOfBounds';
  }

  // The illustrated bunkers overlap the edge of the green. Hazards take
  // precedence so a ball visibly in sand can never be assigned the putter.
  if (
    insideEllipse(position, { x: -15, y: 377 }, 12, 16) ||
    insideEllipse(position, { x: 17, y: 376 }, 12, 15)
  ) {
    return 'bunker';
  }

  if (insideEllipse(position, PIN_POSITION, 29, 19)) {
    return 'green';
  }

  if (
    insideEllipse(position, { x: -53, y: 176 }, 24, 92) ||
    insideEllipse(position, { x: 55, y: 245 }, 18, 72)
  ) {
    return 'water';
  }

  if (
    (position.y <= 15 && Math.abs(position.x) <= 16) ||
    (position.y >= 34 && position.y <= 50 && Math.abs(position.x) <= 16)
  ) {
    return 'tee';
  }

  if (Math.abs(position.x - fairwayCentre(position.y)) <= fairwayHalfWidth(position.y)) {
    return 'fairway';
  }

  return 'rough';
}

export function teePositionForGender(gender: GolferGender): WorldPosition {
  return gender === 'female'
    ? { ...FRONT_TEE_POSITION }
    : { ...BACK_TEE_POSITION };
}

export function distanceBetween(a: WorldPosition, b: WorldPosition): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function distanceToPin(position: WorldPosition): number {
  return distanceBetween(position, PIN_POSITION);
}

export function worldToMap(position: WorldPosition): ScreenPosition {
  const x = MAP_CENTRE_X + (position.x / MAP_LATERAL_METRES) * MAP_LATERAL_PIXELS;
  const y = MAP_TEE_Y - (position.y / PROTOTYPE_HOLE.distanceMetres) * (MAP_TEE_Y - MAP_PIN_Y);
  return {
    x: Math.max(13, Math.min(339, x)),
    y: Math.max(48, Math.min(189, y)),
  };
}

export function lieLabel(lie: Lie): string {
  return LIE_TUNING[lie].label;
}

export function isPenaltyLie(lie: Lie): boolean {
  return lie === 'water' || lie === 'outOfBounds';
}
