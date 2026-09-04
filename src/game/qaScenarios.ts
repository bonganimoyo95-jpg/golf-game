import { getLieAt, teePositionForChoice, type WorldPosition } from './courseModel';
import type { Lie } from './data';
import type { PlayerProfile } from './playerProfile';

export const QA_SCENARIO_REGISTRY_KEY = 'qa-scenario';

export type QaScenarioId =
  | 'tee'
  | 'fairway'
  | 'rough'
  | 'bunker'
  | 'chip'
  | 'green-short'
  | 'green-long'
  | 'water-drop'
  | 'out-of-bounds';

export interface QaScenario {
  id: QaScenarioId;
  label: string;
  instruction: string;
  position?: WorldPosition;
  expectedLie?: Lie;
  clubIndex: number;
  aimDegrees: number;
}

export interface ResolvedQaScenario extends QaScenario {
  position: WorldPosition;
  lie: Lie;
}

export const QA_SCENARIOS: readonly QaScenario[] = [
  {
    id: 'tee',
    label: 'TEE SHOT',
    instruction: 'VERIFY DRIVER, MAP AND OPENING VIEW',
    clubIndex: 0,
    aimDegrees: 0,
  },
  {
    id: 'fairway',
    label: 'FAIRWAY',
    instruction: 'VERIFY 3-WOOD AND BALL-BASED SECOND SHOT CAMERA',
    position: { x: 26, y: 215 },
    expectedLie: 'fairway',
    clubIndex: 1,
    aimDegrees: 0,
  },
  {
    id: 'rough',
    label: 'ROUGH',
    instruction: 'VERIFY ROUGH LIE AND CLUB RESTRICTIONS',
    position: { x: 52, y: 310 },
    expectedLie: 'rough',
    clubIndex: 2,
    aimDegrees: 8,
  },
  {
    id: 'bunker',
    label: 'BUNKER',
    instruction: 'VERIFY AUTO SPLASH AND SAND LIE',
    position: { x: -59, y: 485 },
    expectedLie: 'bunker',
    clubIndex: 3,
    aimDegrees: 10,
  },
  {
    id: 'chip',
    label: 'AUTO CHIP',
    instruction: 'VERIFY WEDGE BECOMES CHIP INSIDE 45 M',
    position: { x: -5, y: 455 },
    expectedLie: 'rough',
    clubIndex: 3,
    aimDegrees: 0,
  },
  {
    id: 'green-short',
    label: 'PUTT 6 M',
    instruction: 'VERIFY CUP LINE, FACING AND POWER BAND',
    position: { x: -33, y: 464 },
    expectedLie: 'green',
    clubIndex: 4,
    aimDegrees: 0,
  },
  {
    id: 'green-long',
    label: 'PUTT 18 M',
    instruction: 'VERIFY NARROWER LONG-PUTT POWER BAND',
    position: { x: -33, y: 452 },
    expectedLie: 'green',
    clubIndex: 4,
    aimDegrees: 0,
  },
  {
    id: 'water-drop',
    label: 'WATER DROP',
    instruction: 'USE FULL WEDGE AT 0° TO PIN · VERIFY CREEK ENTRY DROP',
    position: { x: -39, y: 345 },
    expectedLie: 'fairway',
    clubIndex: 3,
    aimDegrees: 0,
  },
  {
    id: 'out-of-bounds',
    label: 'OUT OF BOUNDS',
    instruction: 'USE FULL 3-WOOD AT -30° FROM PIN · VERIFY PREVIOUS SPOT',
    position: { x: 20, y: 300 },
    expectedLie: 'fairway',
    clubIndex: 1,
    aimDegrees: -30,
  },
] as const;

export function findQaScenario(value: unknown): QaScenario | undefined {
  return QA_SCENARIOS.find((scenario) => scenario.id === value);
}

export function resolveQaScenario(
  value: unknown,
  profile: PlayerProfile,
): ResolvedQaScenario | undefined {
  const scenario = findQaScenario(value);
  if (!scenario) return undefined;
  const position = scenario.position
    ? { ...scenario.position }
    : teePositionForChoice(profile.tee);
  return {
    ...scenario,
    position,
    lie: getLieAt(position),
  };
}
