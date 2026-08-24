import { describe, expect, it } from 'vitest';
import { CLUBS } from './data';
import {
  clubForProfile,
  normalizePlayerProfile,
  profileLabel,
  teeLabel,
} from './playerProfile';

describe('player profile', () => {
  it('gives both selectable golfers identical club performance', () => {
    const maleDriver = clubForProfile(CLUBS[0], {
      gender: 'male',
      handedness: 'right',
      tee: 'back',
    });
    const femaleDriver = clubForProfile(CLUBS[0], {
      gender: 'female',
      handedness: 'right',
      tee: 'back',
    });

    expect(femaleDriver).toEqual(maleDriver);
    expect(femaleDriver.maxDistanceMetres).toBe(CLUBS[0].maxDistanceMetres);
  });

  it('retains an explicit golfer, stance and tee combination', () => {
    const profile = normalizePlayerProfile({
      gender: 'female',
      handedness: 'left',
      tee: 'back',
    });
    expect(profile).toEqual({
      gender: 'female',
      handedness: 'left',
      tee: 'back',
    });
    expect(profileLabel(profile)).toBe('FEMALE · LEFT-HANDED');
    expect(teeLabel(profile.tee)).toBe('BACK TEES');
  });

  it('migrates a v0.7 female profile to its former forward tee', () => {
    expect(normalizePlayerProfile({ gender: 'female', handedness: 'right' })).toEqual({
      gender: 'female',
      handedness: 'right',
      tee: 'forward',
    });
  });
});
