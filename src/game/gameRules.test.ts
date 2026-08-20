import { describe, expect, it } from 'vitest';
import { CLUBS } from './data';
import {
  allowedClubIndices,
  nextAllowedClubIndex,
  recommendedClubIndex,
} from './gameRules';

describe('lie-based club rules', () => {
  it('allows the driver only from a tee', () => {
    expect(allowedClubIndices('tee')).toContain(0);
    expect(allowedClubIndices('fairway')).not.toContain(0);
    expect(allowedClubIndices('rough')).not.toContain(0);
    expect(allowedClubIndices('bunker')).not.toContain(0);
  });

  it('forces the putter on the green', () => {
    expect(allowedClubIndices('green')).toEqual([3]);
    expect(nextAllowedClubIndex(0, 1, 'green')).toBe(3);
  });

  it('recommends an iron rather than a driver for a long fairway shot', () => {
    expect(recommendedClubIndex(205, 'fairway', CLUBS)).toBe(1);
  });
});
