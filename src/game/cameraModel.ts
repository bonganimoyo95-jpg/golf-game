import { PROTOTYPE_HOLE } from './data';
import { distanceBetween, type WorldPosition } from './courseModel';
import type { Handedness } from './playerProfile';
import type { ShotResult, TrajectoryPoint } from './physics/shotPhysics';

export interface CropRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export const LANDSCAPE_SOURCE_WIDTH = 672;
export const LANDSCAPE_SOURCE_HEIGHT = 302;
export const LANDSCAPE_GROUND_Y = 329;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothStep(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function easeOutCubic(value: number): number {
  const clamped = clamp(value, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

export function courseProgress(position: WorldPosition): number {
  return clamp(position.y / PROTOTYPE_HOLE.distanceMetres, 0, 1);
}

export function landscapeCropForPosition(
  position: WorldPosition,
  chaseZoom = 0,
): CropRectangle {
  const progress = courseProgress(position);
  const zoom = 1 + progress * 0.36 + clamp(chaseZoom, 0, 1) * 0.22;
  const width = LANDSCAPE_SOURCE_WIDTH / zoom;
  const height = LANDSCAPE_SOURCE_HEIGHT / zoom;
  const lateral = clamp(position.x / 74, -1, 1);
  const centreX = clamp(
    LANDSCAPE_SOURCE_WIDTH / 2 + lateral * 72,
    width / 2,
    LANDSCAPE_SOURCE_WIDTH - width / 2,
  );
  const centreY = clamp(
    LANDSCAPE_SOURCE_HEIGHT / 2 + progress * 36,
    height / 2,
    LANDSCAPE_SOURCE_HEIGHT - height / 2,
  );

  return {
    x: centreX - width / 2,
    y: centreY - height / 2,
    width,
    height,
  };
}

export function ballAddressScreenX(handedness: Handedness): number {
  return handedness === 'right' ? 132 : 220;
}

export function ballLandingScreenX(handedness: Handedness): number {
  return handedness === 'right' ? 220 : 132;
}

export function shotBallScreenPosition(
  result: ShotResult,
  sample: TrajectoryPoint,
  animationProgress: number,
  handedness: Handedness,
): ScreenPoint {
  const direction = handedness === 'right' ? 1 : -1;
  const startX = ballAddressScreenX(handedness);
  const totalDistance = Math.max(0.01, distanceBetween(result.start, result.visualEnd));
  const travelled = clamp(distanceBetween(result.start, sample) / totalDistance, 0, 1.15);
  const airborneTravel = easeOutCubic(Math.min(animationProgress / 0.7, 1));
  const projectedX = startX + direction * (64 + travelled * 92) * airborneTravel;
  const chase = smoothStep((animationProgress - 0.57) / 0.43);
  const x = projectedX + (ballLandingScreenX(handedness) - projectedX) * chase;
  const finalDirectionOffset = clamp(
    result.launchDirectionDegrees - result.aimDegrees,
    -18,
    18,
  );
  const groundY = LANDSCAPE_GROUND_Y + finalDirectionOffset * 0.32;

  return {
    x: clamp(x, 10, 342),
    y: clamp(groundY - sample.height * 2.45, 213, 346),
  };
}
