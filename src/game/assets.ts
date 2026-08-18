import type { GolferGender } from './playerProfile';

export const ASSETS = {
  courseMap: 'course-map',
  coursePanorama: 'course-panorama',
} as const;

export const GOLFER_POSES = [
  'idle',
  'address',
  'backswing',
  'top',
  'downswing',
  'impact',
  'follow-through',
  'watch',
  'putt-address',
  'putt-stroke',
  'celebrate',
  'neutral',
] as const;

export type GolferPose = (typeof GOLFER_POSES)[number];

export function golferAsset(gender: GolferGender, pose: GolferPose): string {
  return `golfer-${gender}-${pose}`;
}

const GOLFER_ASSET_PATHS: ReadonlyArray<readonly [string, string]> = (
  ['male', 'female'] as const
).flatMap((gender) =>
  GOLFER_POSES.map(
    (pose) =>
      [golferAsset(gender, pose), `assets/golfer-${gender}-${pose}.png`] as const,
  ),
);

export const ASSET_PATHS: ReadonlyArray<readonly [string, string]> = [
  [ASSETS.courseMap, 'assets/course-map.png'],
  [ASSETS.coursePanorama, 'assets/course-panorama.png'],
  ...GOLFER_ASSET_PATHS,
];
