import { describe, expect, it } from 'vitest';
import {
  FRONT_TEE_POSITION,
  PIN_POSITION,
  distanceToPin,
  getLieAt,
  teePositionForGender,
} from './courseModel';

describe('course surface model', () => {
  it('uses the front tee for the female golfer', () => {
    expect(teePositionForGender('female')).toEqual(FRONT_TEE_POSITION);
    expect(distanceToPin(teePositionForGender('female'))).toBeLessThan(
      distanceToPin(teePositionForGender('male')),
    );
    expect(getLieAt(FRONT_TEE_POSITION)).toBe('tee');
  });

  it('classifies the illustrated greenside sand as bunker before green', () => {
    expect(getLieAt({ x: -15, y: 377 })).toBe('bunker');
    expect(getLieAt({ x: 17, y: 376 })).toBe('bunker');
    expect(getLieAt(PIN_POSITION)).toBe('green');
  });
});
