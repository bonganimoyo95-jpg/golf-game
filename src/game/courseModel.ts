import { LIE_TUNING, type Lie } from './data';
import {
  BACK_TEE_POSITION,
  COURSE_DEFINITION,
  FRONT_TEE_POSITION,
  PIN_POSITION,
  fairwayCentreAt,
  fairwayHalfWidthAt,
  insideEllipse,
  type WorldPosition,
} from './courseDefinition';
import type { TeeChoice } from './playerProfile';

export type { WorldPosition } from './courseDefinition';
export {
  BACK_TEE_POSITION,
  COURSE_DEFINITION,
  FRONT_TEE_POSITION,
  PIN_POSITION,
  fairwayCentreAt,
  fairwayHalfWidthAt,
} from './courseDefinition';

export interface ScreenPosition {
  x: number;
  y: number;
}

export interface CourseMapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TEE_POSITION = BACK_TEE_POSITION;
export const DEFAULT_COURSE_MAP_BOUNDS: Readonly<CourseMapBounds> = {
  x: 8,
  y: 43,
  width: 336,
  height: 151,
};

function isInsideBounds(position: WorldPosition): boolean {
  const bounds = COURSE_DEFINITION.bounds;
  return (
    position.x >= bounds.minimumX &&
    position.x <= bounds.maximumX &&
    position.y >= bounds.minimumY &&
    position.y <= bounds.maximumY
  );
}

export function getLieAt(position: WorldPosition): Lie {
  if (!isInsideBounds(position)) return 'outOfBounds';

  // Sand overlaps the putting surface in the authored definition. This order
  // is shared by gameplay and rendering, so visible sand always plays as sand.
  const bunker = COURSE_DEFINITION.surfaces.find(
    (surface) => surface.lie === 'bunker' && insideEllipse(position, surface),
  );
  if (bunker) return 'bunker';

  const green = COURSE_DEFINITION.surfaces.find(
    (surface) => surface.lie === 'green' && insideEllipse(position, surface),
  );
  if (green) return 'green';

  const water = COURSE_DEFINITION.surfaces.find(
    (surface) => surface.lie === 'water' && insideEllipse(position, surface),
  );
  if (water) return 'water';

  const tee = COURSE_DEFINITION.tees.find(
    (surface) =>
      Math.abs(position.x - surface.centre.x) <= surface.halfWidth &&
      Math.abs(position.y - surface.centre.y) <= surface.halfDepth,
  );
  if (tee) return 'tee';

  if (
    Math.abs(position.x - fairwayCentreAt(position.y)) <=
    fairwayHalfWidthAt(position.y)
  ) {
    return 'fairway';
  }

  return 'rough';
}

export function teePositionForChoice(tee: TeeChoice): WorldPosition {
  return tee === 'forward'
    ? { ...FRONT_TEE_POSITION }
    : { ...BACK_TEE_POSITION };
}

export function distanceBetween(a: WorldPosition, b: WorldPosition): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function distanceToPin(position: WorldPosition): number {
  return distanceBetween(position, PIN_POSITION);
}

export function worldToMapWithin(
  position: WorldPosition,
  mapBounds: CourseMapBounds,
): ScreenPosition {
  const courseBounds = COURSE_DEFINITION.bounds;
  const horizontalPadding = Math.min(13, mapBounds.width * 0.08);
  const verticalPadding = Math.min(12, mapBounds.height * 0.08);
  const usableWidth = mapBounds.width - horizontalPadding * 2;
  const usableHeight = mapBounds.height - verticalPadding * 2;
  const xProgress =
    (position.x - courseBounds.minimumX) /
    (courseBounds.maximumX - courseBounds.minimumX);
  const yProgress =
    (position.y - courseBounds.minimumY) /
    (courseBounds.maximumY - courseBounds.minimumY);

  return {
    x:
      mapBounds.x +
      horizontalPadding +
      Math.max(0, Math.min(1, xProgress)) * usableWidth,
    y:
      mapBounds.y +
      mapBounds.height -
      verticalPadding -
      Math.max(0, Math.min(1, yProgress)) * usableHeight,
  };
}

export function worldToMap(position: WorldPosition): ScreenPosition {
  return worldToMapWithin(position, DEFAULT_COURSE_MAP_BOUNDS);
}

export function lieLabel(lie: Lie): string {
  return LIE_TUNING[lie].label;
}

export function isPenaltyLie(lie: Lie): boolean {
  return lie === 'water' || lie === 'outOfBounds';
}
