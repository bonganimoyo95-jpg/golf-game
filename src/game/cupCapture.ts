import { distanceBetween, type WorldPosition } from './courseModel';

export const CUP_CAPTURE_RADIUS_METRES = 0.34;
export const MAX_CAPTURE_OVERRUN_METRES = 1.2;

export interface CupCaptureResult {
  holed: boolean;
  closestDistanceMetres: number;
  overrunMetres: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function evaluateCupCapture(
  start: WorldPosition,
  end: WorldPosition,
  cup: WorldPosition,
): CupCaptureResult {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) {
    const closestDistanceMetres = distanceBetween(start, cup);
    return {
      holed: closestDistanceMetres <= CUP_CAPTURE_RADIUS_METRES,
      closestDistanceMetres,
      overrunMetres: 0,
    };
  }

  const projection =
    ((cup.x - start.x) * segmentX + (cup.y - start.y) * segmentY) /
    segmentLengthSquared;
  const segmentProgress = clamp(projection, 0, 1);
  const closestPoint = {
    x: start.x + segmentX * segmentProgress,
    y: start.y + segmentY * segmentProgress,
  };
  const closestDistanceMetres = distanceBetween(closestPoint, cup);
  const overrunMetres = distanceBetween(closestPoint, end);
  const travelledTowardCup = projection > 0;

  return {
    holed:
      travelledTowardCup &&
      closestDistanceMetres <= CUP_CAPTURE_RADIUS_METRES &&
      overrunMetres <= MAX_CAPTURE_OVERRUN_METRES,
    closestDistanceMetres,
    overrunMetres,
  };
}
