import { distanceBetween, type WorldPosition } from './courseModel';

export const CUP_CAPTURE_RADIUS_METRES = 0.44;
export const MIN_CUP_CAPTURE_RADIUS_METRES = 0.3;
export const MAX_CAPTURE_OVERRUN_METRES = 1.4;

export interface CupCaptureResult {
  holed: boolean;
  closestDistanceMetres: number;
  overrunMetres: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function cupCaptureRadiusForDistance(distanceMetres: number): number {
  const distanceShare = clamp((distanceMetres - 3) / 19, 0, 1);
  return (
    CUP_CAPTURE_RADIUS_METRES -
    distanceShare * (CUP_CAPTURE_RADIUS_METRES - MIN_CUP_CAPTURE_RADIUS_METRES)
  );
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
  const startingDistanceMetres = distanceBetween(start, cup);
  const captureRadius = cupCaptureRadiusForDistance(startingDistanceMetres);

  return {
    holed:
      travelledTowardCup &&
      closestDistanceMetres <= captureRadius &&
      overrunMetres <= MAX_CAPTURE_OVERRUN_METRES,
    closestDistanceMetres,
    overrunMetres,
  };
}
