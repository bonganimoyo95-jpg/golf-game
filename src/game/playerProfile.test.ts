import { describe, expect, it } from 'vitest';
import { CLUBS } from './data';
import {
  clubForProfile,
  normalizePlayerProfile,
  profileLabel,
} from './playerProfile';

describe('player profile', () => {
  it('gives the female golfer shorter full-swing club distances', () => {
    const maleDriver = clubForProfile(CLUBS[0], {
      gender: 'male',
      handedness: 'right',
    });
    const femaleDriver = clubForProfile(CLUBS[0], {
      gender: 'female',
      handedness: 'right',
    });
    const femalePutter = clubForProfile(CLUBS[3], {
      gender: 'female',
      handedness: 'right',
    });

    expect(femaleDriver.maxDistanceMetres).toBeLessThan(
      maleDriver.maxDistanceMetres,
    );
    expect(femalePutter.maxDistanceMetres).toBe(CLUBS[3].maxDistanceMetres);
  });

  it('retains female and left-handed selections', () => {
    const profile = normalizePlayerProfile({ gender: 'female', handedness: 'left' });
    expect(profile).toEqual({ gender: 'female', handedness: 'left' });
    expect(profileLabel(profile)).toBe('FEMALE · LEFT-HANDED');
  });
});
