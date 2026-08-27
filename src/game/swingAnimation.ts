import type { GolferPose } from './assets';

export type SwingAnimationKind = 'full' | 'putt';

export interface SwingKeyframe {
  atMs: number;
  pose: GolferPose;
  xOffset: number;
  yOffset: number;
  angleDegrees: number;
  scale: number;
}

export interface SwingVisualState extends SwingKeyframe {
  elapsedMs: number;
}

const FULL_SWING_KEYFRAMES: readonly SwingKeyframe[] = [
  { atMs: 0, pose: 'address', xOffset: 0, yOffset: 0, angleDegrees: 0, scale: 1 },
  {
    atMs: 85,
    pose: 'backswing',
    xOffset: -0.5,
    yOffset: -0.3,
    angleDegrees: -0.45,
    scale: 1.004,
  },
  {
    atMs: 305,
    pose: 'top',
    xOffset: -1.2,
    yOffset: -0.8,
    angleDegrees: -0.8,
    scale: 1.008,
  },
  {
    atMs: 355,
    pose: 'top',
    xOffset: -1.15,
    yOffset: -0.75,
    angleDegrees: -0.7,
    scale: 1.008,
  },
  {
    atMs: 410,
    pose: 'downswing',
    xOffset: -0.2,
    yOffset: 0,
    angleDegrees: 0.35,
    scale: 1.004,
  },
  {
    atMs: 520,
    pose: 'impact',
    xOffset: 1.1,
    yOffset: 0.2,
    angleDegrees: 0.75,
    scale: 1,
  },
  {
    atMs: 555,
    pose: 'impact',
    xOffset: 1,
    yOffset: 0.1,
    angleDegrees: 0.65,
    scale: 1,
  },
  {
    atMs: 620,
    pose: 'follow-through',
    xOffset: 0,
    yOffset: -0.5,
    angleDegrees: 0,
    scale: 1,
  },
  {
    atMs: 830,
    pose: 'follow-through',
    xOffset: 0,
    yOffset: 0,
    angleDegrees: 0,
    scale: 1,
  },
];

const PUTTING_KEYFRAMES: readonly SwingKeyframe[] = [
  {
    atMs: 0,
    pose: 'putt-forward-address',
    xOffset: 0,
    yOffset: 0,
    angleDegrees: 0,
    scale: 1,
  },
  {
    atMs: 145,
    pose: 'putt-forward-stroke',
    xOffset: -0.35,
    yOffset: 0,
    angleDegrees: -0.2,
    scale: 1,
  },
  {
    atMs: 285,
    pose: 'putt-forward-stroke',
    xOffset: 0.35,
    yOffset: 0,
    angleDegrees: 0.2,
    scale: 1,
  },
  {
    atMs: 405,
    pose: 'putt-forward-stroke',
    xOffset: 0,
    yOffset: 0,
    angleDegrees: 0,
    scale: 1,
  },
];

export const SWING_KEYFRAMES: Readonly<
  Record<SwingAnimationKind, readonly SwingKeyframe[]>
> = {
  full: FULL_SWING_KEYFRAMES,
  putt: PUTTING_KEYFRAMES,
};

export const SWING_LAUNCH_TIME_MS: Readonly<Record<SwingAnimationKind, number>> = {
  full: 520,
  putt: 285,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function swingDurationMs(kind: SwingAnimationKind): number {
  return SWING_KEYFRAMES[kind].at(-1)?.atMs ?? 0;
}

export function swingVisualStateAt(
  kind: SwingAnimationKind,
  elapsedValueMs: number,
): SwingVisualState {
  const keyframes = SWING_KEYFRAMES[kind];
  const elapsedMs = clamp(elapsedValueMs, 0, swingDurationMs(kind));
  let currentIndex = 0;

  for (let index = 1; index < keyframes.length; index += 1) {
    if (keyframes[index].atMs > elapsedMs) break;
    currentIndex = index;
  }

  const current = keyframes[currentIndex];
  const next = keyframes[Math.min(currentIndex + 1, keyframes.length - 1)];
  const interval = Math.max(1, next.atMs - current.atMs);
  const progress = clamp((elapsedMs - current.atMs) / interval, 0, 1);
  const easedProgress = progress * progress * (3 - 2 * progress);

  return {
    atMs: current.atMs,
    pose: current.pose,
    xOffset: interpolate(current.xOffset, next.xOffset, easedProgress),
    yOffset: interpolate(current.yOffset, next.yOffset, easedProgress),
    angleDegrees: interpolate(
      current.angleDegrees,
      next.angleDegrees,
      easedProgress,
    ),
    scale: interpolate(current.scale, next.scale, easedProgress),
    elapsedMs,
  };
}
