import type { ClubDefinition } from './data';

export type GolferGender = 'male' | 'female';
export type Handedness = 'right' | 'left';

export interface PlayerProfile {
  gender: GolferGender;
  handedness: Handedness;
}

export const PLAYER_PROFILE_REGISTRY_KEY = 'player-profile';

export const DEFAULT_PLAYER_PROFILE: Readonly<PlayerProfile> = {
  gender: 'male',
  handedness: 'right',
};

export const FEMALE_CLUB_DISTANCE_MULTIPLIER = 0.88;

export function normalizePlayerProfile(value: unknown): PlayerProfile {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_PLAYER_PROFILE };
  }

  const candidate = value as Partial<PlayerProfile>;
  return {
    gender: candidate.gender === 'female' ? 'female' : 'male',
    handedness: candidate.handedness === 'left' ? 'left' : 'right',
  };
}

export function clubForProfile(
  club: ClubDefinition,
  profile: PlayerProfile,
): ClubDefinition {
  if (profile.gender === 'male' || club.isPutter) {
    return club;
  }

  return {
    ...club,
    maxDistanceMetres: Math.round(
      club.maxDistanceMetres * FEMALE_CLUB_DISTANCE_MULTIPLIER,
    ),
  };
}

export function profileLabel(profile: PlayerProfile): string {
  return `${profile.gender === 'female' ? 'FEMALE' : 'MALE'} · ${
    profile.handedness === 'left' ? 'LEFT' : 'RIGHT'
  }-HANDED`;
}
