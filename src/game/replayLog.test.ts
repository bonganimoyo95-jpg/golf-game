import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from './data';
import { calculateShot } from './physics/shotPhysics';
import {
  appendReplayShot,
  createReplaySession,
  parseReplay,
  replayMatchesRecord,
  serializeReplay,
} from './replayLog';

describe('deterministic replay log', () => {
  it('round-trips a shot and reproduces its resolved outcome', () => {
    const input = {
      start: { x: 0, y: 0 },
      startingLie: 'tee' as const,
      club: CLUBS[0],
      power: 0.83,
      accuracyError: -0.17,
      aimDegrees: 6,
      wind: PROTOTYPE_HOLE.wind,
    };
    const result = calculateShot(input);
    const session = appendReplayShot(
      createReplaySession({
        gender: 'female',
        handedness: 'left',
        tee: 'forward',
      }),
      input,
      result,
    );
    const parsed = parseReplay(serializeReplay(session));

    expect(parsed).toEqual(session);
    expect(parsed?.shots).toHaveLength(1);
    expect(replayMatchesRecord(parsed!.shots[0])).toBe(true);
  });

  it('rejects malformed and incompatible replay data', () => {
    expect(parseReplay('not json')).toBeUndefined();
    expect(parseReplay('{"formatVersion":99,"shots":[]}')).toBeUndefined();
  });
});
