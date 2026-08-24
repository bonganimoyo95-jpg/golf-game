import type { Lie } from './data';
import {
  PIN_POSITION,
  distanceToPin,
  type WorldPosition,
} from './courseModel';
import type { Handedness } from './playerProfile';
import type { ShotResult, TrajectoryPoint } from './physics/shotPhysics';

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface CourseCamera {
  position: WorldPosition;
  bearingDegrees: number;
}

export interface ProjectedCoursePoint extends ScreenPoint {
  forwardMetres: number;
  lateralMetres: number;
  scale: number;
  visible: boolean;
}

export type CourseViewStage = 'tee' | 'fairway' | 'approach' | 'green';

export const COURSE_VIEW_LEFT = 8;
export const COURSE_VIEW_TOP = 201;
export const COURSE_VIEW_WIDTH = 336;
export const COURSE_VIEW_HEIGHT = 151;
export const COURSE_VIEW_CENTRE_X = COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH / 2;
export const COURSE_VIEW_HORIZON_Y = 257;
export const LANDSCAPE_GROUND_Y = 329;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothStep(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function directionVector(degrees: number): WorldPosition {
  const radians = (degrees * Math.PI) / 180;
  return { x: Math.sin(radians), y: Math.cos(radians) };
}

export function bearingBetween(
  from: WorldPosition,
  to: WorldPosition,
): number {
  return (Math.atan2(to.x - from.x, to.y - from.y) * 180) / Math.PI;
}

export function bearingToPinFrom(position: WorldPosition): number {
  return bearingBetween(position, PIN_POSITION);
}

export function courseViewStage(
  position: WorldPosition,
  lie?: Lie,
): CourseViewStage {
  if (lie === 'green') return 'green';
  if (distanceToPin(position) <= 105) return 'approach';
  if (position.y >= 70) return 'fairway';
  return 'tee';
}

export function worldToCameraSpace(
  point: WorldPosition,
  camera: CourseCamera,
): { forwardMetres: number; lateralMetres: number } {
  const radians = (camera.bearingDegrees * Math.PI) / 180;
  const deltaX = point.x - camera.position.x;
  const deltaY = point.y - camera.position.y;
  return {
    forwardMetres: deltaX * Math.sin(radians) + deltaY * Math.cos(radians),
    lateralMetres: deltaX * Math.cos(radians) - deltaY * Math.sin(radians),
  };
}

export function projectWorldToCourseView(
  point: WorldPosition,
  camera: CourseCamera,
  heightMetres = 0,
): ProjectedCoursePoint {
  const { forwardMetres, lateralMetres } = worldToCameraSpace(point, camera);
  const projectionDepth = Math.max(0, forwardMetres);
  const depthShare = projectionDepth / (projectionDepth + 42);
  const scale = 1 - depthShare * 0.82;
  const groundY =
    LANDSCAPE_GROUND_Y -
    depthShare * (LANDSCAPE_GROUND_Y - COURSE_VIEW_HORIZON_Y);
  const x = COURSE_VIEW_CENTRE_X + lateralMetres * 2.3 * scale;
  const y = groundY - heightMetres * (1.5 + scale * 0.65);

  return {
    x,
    y,
    forwardMetres,
    lateralMetres,
    scale,
    visible:
      forwardMetres >= -6 &&
      forwardMetres <= 480 &&
      x >= COURSE_VIEW_LEFT - 110 &&
      x <= COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH + 110 &&
      y >= COURSE_VIEW_TOP - 30 &&
      y <= COURSE_VIEW_TOP + COURSE_VIEW_HEIGHT + 20,
  };
}

export function shotCameraForSample(
  result: ShotResult,
  sample: TrajectoryPoint,
  animationProgress: number,
): CourseCamera {
  const direction = directionVector(result.launchDirectionDegrees);
  const initialCamera = {
    x: result.start.x - direction.x * 3,
    y: result.start.y - direction.y * 3,
  };
  const chaseDistance = 18;
  const desiredCamera = {
    x: sample.x - direction.x * chaseDistance,
    y: sample.y - direction.y * chaseDistance,
  };
  const chase = smoothStep(clamp(animationProgress / 0.72, 0, 1));

  return {
    position: {
      x: initialCamera.x + (desiredCamera.x - initialCamera.x) * chase,
      y: initialCamera.y + (desiredCamera.y - initialCamera.y) * chase,
    },
    bearingDegrees: result.launchDirectionDegrees,
  };
}

export function shotCameraTravelMetres(
  result: ShotResult,
  sample: TrajectoryPoint,
  animationProgress: number,
): number {
  const camera = shotCameraForSample(result, sample, animationProgress);
  const direction = directionVector(result.launchDirectionDegrees);
  return (
    (camera.position.x - result.start.x) * direction.x +
    (camera.position.y - result.start.y) * direction.y
  );
}

export function ballAddressScreenX(handedness: Handedness): number {
  return handedness === 'right' ? 132 : 220;
}

export function shotBallScreenPosition(
  result: ShotResult,
  sample: TrajectoryPoint,
  animationProgress: number,
  handedness: Handedness,
): ScreenPoint {
  const camera = shotCameraForSample(result, sample, animationProgress);
  const projected = projectWorldToCourseView(sample, camera, sample.height);
  const launchBlend = smoothStep(animationProgress / 0.16);
  return {
    x: clamp(
      ballAddressScreenX(handedness) +
        (projected.x - ballAddressScreenX(handedness)) * launchBlend,
      COURSE_VIEW_LEFT + 3,
      COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH - 3,
    ),
    y: clamp(
      LANDSCAPE_GROUND_Y +
        (projected.y - LANDSCAPE_GROUND_Y) * launchBlend,
      COURSE_VIEW_TOP + 3,
      COURSE_VIEW_TOP + COURSE_VIEW_HEIGHT - 5,
    ),
  };
}

export function puttingAimTargetScreenPosition(
  ball: ScreenPoint,
  cup: ScreenPoint,
  relativeAimDegrees: number,
): ScreenPoint {
  const radians = (relativeAimDegrees * Math.PI) / 180;
  return {
    x: cup.x,
    y: clamp(ball.y + (cup.x - ball.x) * Math.tan(radians), 286, 350),
  };
}

export function puttingRollScreenPosition(
  ball: ScreenPoint,
  cup: ScreenPoint,
  distanceRatio: number,
  relativeAimDegrees: number,
): ScreenPoint {
  const availablePixels = Math.abs(cup.x - ball.x);
  const direction = cup.x >= ball.x ? 1 : -1;
  const travelPixels = availablePixels * clamp(distanceRatio, 0, 1.28);
  const x = clamp(ball.x + direction * travelPixels, 11, 341);
  const radians = (relativeAimDegrees * Math.PI) / 180;

  return {
    x,
    y: clamp(ball.y + (x - ball.x) * Math.tan(radians), 286, 350),
  };
}
