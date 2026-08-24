import type { GolferGender } from './playerProfile';

export const ASSETS = {
  coursePanorama: 'course-panorama',
  titleCover: 'title-cover',
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

export const BOOT_ASSET_PATHS: ReadonlyArray<readonly [string, string]> = [
  [ASSETS.titleCover, 'assets/title-cover.png'],
];

export const GAMEPLAY_ASSET_PATHS: ReadonlyArray<readonly [string, string]> = [
  [ASSETS.coursePanorama, 'assets/course-panorama.png'],
  ...GOLFER_ASSET_PATHS,
];

export const ASSET_PATHS: ReadonlyArray<readonly [string, string]> = [
  ...BOOT_ASSET_PATHS,
  ...GAMEPLAY_ASSET_PATHS,
];
