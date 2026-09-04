import { describe, expect, it } from 'vitest';
import { CLUBS } from './data';
import {
  AUTO_CHIP_DISTANCE_METRES,
  effectiveClubForShot,
  minimumPowerForClub,
} from './shortGame';

const wedge = CLUBS.find((club) => club.id === 'wedge')!;

describe('automatic short game', () => {
  it('turns the wedge into a chip near the green without adding a club slot', () => {
    const club = effectiveClubForShot(wedge, AUTO_CHIP_DISTANCE_METRES, 'fairway');
    expect(club.id).toBe('wedge');
    expect(club.shortName).toBe('CHIP');
    expect(club.shotStyle).toBe('chip');
    expect(minimumPowerForClub(club)).toBe(0.05);
  });

  it('uses a splash from a nearby bunker', () => {
    const club = effectiveClubForShot(wedge, 24, 'bunker');
    expect(club.shortName).toBe('SPLASH');
    expect(club.shotStyle).toBe('splash');
  });

  it('keeps the full wedge outside short-game range', () => {
    const club = effectiveClubForShot(wedge, 46, 'rough');
    expect(club.shortName).toBe('WDG');
    expect(club.shotStyle).toBe('standard');
    expect(minimumPowerForClub(club)).toBe(0.15);
  });
});
