import type { ClubDefinition } from './data';

export type GolferGender = 'male' | 'female';
export type Handedness = 'right' | 'left';
export type TeeChoice = 'back' | 'forward';

export interface PlayerProfile {
  gender: GolferGender;
  handedness: Handedness;
  tee: TeeChoice;
}

export const PLAYER_PROFILE_REGISTRY_KEY = 'player-profile';

export const DEFAULT_PLAYER_PROFILE: Readonly<PlayerProfile> = {
  gender: 'male',
  handedness: 'right',
  tee: 'back',
};

export function normalizePlayerProfile(value: unknown): PlayerProfile {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_PLAYER_PROFILE };
  }

  const candidate = value as Partial<PlayerProfile>;
  const gender = candidate.gender === 'female' ? 'female' : 'male';
  return {
    gender,
    handedness: candidate.handedness === 'left' ? 'left' : 'right',
    // v0.7 profiles had no explicit tee field. Preserve their old starting tee
    // once, while all newly saved profiles make the choice independently.
    tee:
      candidate.tee === 'forward' || candidate.tee === 'back'
        ? candidate.tee
        : gender === 'female'
          ? 'forward'
          : 'back',
  };
}

export function clubForProfile(
  club: ClubDefinition,
  _profile: PlayerProfile,
): ClubDefinition {
  return club;
}

export function teeLabel(tee: TeeChoice): string {
  return tee === 'forward' ? 'FORWARD TEES' : 'BACK TEES';
}

export function profileLabel(profile: PlayerProfile): string {
  return `${profile.gender === 'female' ? 'FEMALE' : 'MALE'} · ${
    profile.handedness === 'left' ? 'LEFT' : 'RIGHT'
  }-HANDED`;
}
