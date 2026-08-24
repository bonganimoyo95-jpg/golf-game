import { describe, expect, it } from 'vitest';
import {
  ASSET_PATHS,
  BOOT_ASSET_PATHS,
  GAMEPLAY_ASSET_PATHS,
  GOLFER_POSES,
  golferAsset,
} from './assets';

describe('runtime asset manifest', () => {
  it('contains unique keys and portable PNG paths for every runtime asset', () => {
    const keys = ASSET_PATHS.map(([key]) => key);
    expect(new Set(keys).size).toBe(keys.length);

    for (const [, relativePath] of ASSET_PATHS) {
      expect(relativePath).toMatch(/^assets\/[a-z0-9-]+\.png$/);
    }
  });

  it('provides every pose for both selectable golfers', () => {
    for (const gender of ['male', 'female'] as const) {
      for (const pose of GOLFER_POSES) {
        expect(ASSET_PATHS.some(([key]) => key === golferAsset(gender, pose))).toBe(
          true,
        );
      }
    }
  });

  it('loads the cover first and defers gameplay art until Play is pressed', () => {
    expect(BOOT_ASSET_PATHS.map(([key]) => key)).toEqual(['title-cover']);
    expect(GAMEPLAY_ASSET_PATHS.some(([key]) => key === 'title-cover')).toBe(false);
    expect(GAMEPLAY_ASSET_PATHS.some(([key]) => key === 'course-panorama')).toBe(true);
  });
});
