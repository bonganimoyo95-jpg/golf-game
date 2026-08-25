import { COURSE_DEFINITION, type WorldPosition } from './courseDefinition';
import type { ClubDefinition, Lie } from './data';
import {
  calculateShot,
  type ShotInput,
  type ShotResult,
  type WindDefinition,
} from './physics/shotPhysics';
import type { PlayerProfile } from './playerProfile';

export const LAST_REPLAY_STORAGE_KEY = 'fairways-friends-last-replay-v1';

export interface ReplayShotInput {
  start: WorldPosition;
  club: ClubDefinition;
  power: number;
  accuracyError: number;
  aimDegrees: number;
  wind: WindDefinition;
  startingLie: Lie;
}

export interface ReplayShotOutcome {
  carryEnd: WorldPosition;
  visualEnd: WorldPosition;
  resolvedEnd: WorldPosition;
  landingLie: Lie;
  finalLie: Lie;
  resolvedLie: Lie;
  penaltyType?: 'water' | 'outOfBounds';
  penaltyEntry?: WorldPosition;
  dropPosition?: WorldPosition;
  holed: boolean;
  strokeCost: number;
}

export interface ReplayShotRecord {
  sequence: number;
  input: ReplayShotInput;
  outcome: ReplayShotOutcome;
}

export interface ReplaySession {
  formatVersion: 1;
  gameVersion: '0.8.0' | '0.8.1';
  courseId: string;
  profile: PlayerProfile;
  scenarioId?: string;
  shots: ReplayShotRecord[];
}

function clonePosition(position: WorldPosition | undefined): WorldPosition | undefined {
  return position ? { ...position } : undefined;
}

function replayInput(input: ShotInput): ReplayShotInput {
  return {
    start: { ...input.start },
    club: { ...input.club },
    power: input.power,
    accuracyError: input.accuracyError,
    aimDegrees: input.aimDegrees,
    wind: { ...input.wind },
    startingLie: input.startingLie,
  };
}

function replayOutcome(result: ShotResult): ReplayShotOutcome {
  return {
    carryEnd: { ...result.carryEnd },
    visualEnd: { ...result.visualEnd },
    resolvedEnd: { ...result.resolvedEnd },
    landingLie: result.landingLie,
    finalLie: result.finalLie,
    resolvedLie: result.resolvedLie,
    penaltyType: result.penaltyType,
    penaltyEntry: clonePosition(result.penaltyEntry),
    dropPosition: clonePosition(result.dropPosition),
    holed: result.holed,
    strokeCost: result.strokeCost,
  };
}

export function createReplaySession(
  profile: PlayerProfile,
  scenarioId?: string,
): ReplaySession {
  return {
    formatVersion: 1,
    gameVersion: '0.8.1',
    courseId: COURSE_DEFINITION.id,
    profile: { ...profile },
    scenarioId,
    shots: [],
  };
}

export function appendReplayShot(
  session: ReplaySession,
  input: ShotInput,
  result: ShotResult,
): ReplaySession {
  return {
    ...session,
    shots: [
      ...session.shots,
      {
        sequence: session.shots.length + 1,
        input: replayInput(input),
        outcome: replayOutcome(result),
      },
    ],
  };
}

export function replayShot(record: ReplayShotRecord): ShotResult {
  return calculateShot({
    ...record.input,
    start: { ...record.input.start },
    club: { ...record.input.club },
    wind: { ...record.input.wind },
  });
}

export function replayMatchesRecord(record: ReplayShotRecord): boolean {
  return JSON.stringify(replayOutcome(replayShot(record))) === JSON.stringify(record.outcome);
}

export function serializeReplay(session: ReplaySession): string {
  return JSON.stringify(session);
}

export function parseReplay(serialized: string): ReplaySession | undefined {
  try {
    const value = JSON.parse(serialized) as Partial<ReplaySession>;
    if (
      value.formatVersion !== 1 ||
      (value.gameVersion !== '0.8.0' && value.gameVersion !== '0.8.1') ||
      value.courseId !== COURSE_DEFINITION.id ||
      !Array.isArray(value.shots) ||
      typeof value.profile !== 'object' ||
      value.profile === null
    ) {
      return undefined;
    }
    return value as ReplaySession;
  } catch {
    return undefined;
  }
}

export function saveReplay(session: ReplaySession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_REPLAY_STORAGE_KEY, serializeReplay(session));
  } catch {
    // Storage can be unavailable in privacy modes; gameplay must continue.
  }
}
