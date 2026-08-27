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

  it('makes the 3-wood a long option from tee, fairway and rough only', () => {
    const woodIndex = CLUBS.findIndex((club) => club.id === 'wood3');
    expect(allowedClubIndices('tee')).toContain(woodIndex);
    expect(allowedClubIndices('fairway')).toContain(woodIndex);
    expect(allowedClubIndices('rough')).toContain(woodIndex);
    expect(allowedClubIndices('bunker')).not.toContain(woodIndex);
    expect(allowedClubIndices('green')).not.toContain(woodIndex);
  });

  it('forces the putter on the green', () => {
    expect(allowedClubIndices('green')).toEqual([4]);
    expect(nextAllowedClubIndex(0, 1, 'green')).toBe(4);
  });

  it('recommends the 3-wood rather than a driver for a long fairway shot', () => {
    expect(recommendedClubIndex(205, 'fairway', CLUBS)).toBe(1);
  });
});
