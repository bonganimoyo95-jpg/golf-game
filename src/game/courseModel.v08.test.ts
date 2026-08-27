import { describe, expect, it } from 'vitest';
import {
  BACK_TEE_POSITION,
  COURSE_DEFINITION,
  FRONT_TEE_POSITION,
  PIN_POSITION,
  distanceToPin,
  getLieAt,
  teePositionForChoice,
  worldToMapWithin,
} from './courseModel';

describe('authoritative course definition', () => {
  it('makes tee choice independent from golfer appearance', () => {
    expect(teePositionForChoice('back')).toEqual(BACK_TEE_POSITION);
    expect(teePositionForChoice('forward')).toEqual(FRONT_TEE_POSITION);
    expect(distanceToPin(teePositionForChoice('forward'))).toBeLessThan(
      distanceToPin(teePositionForChoice('back')),
    );
    expect(getLieAt(FRONT_TEE_POSITION)).toBe('tee');
  });

  it('classifies every authored surface from the same geometry used by art', () => {
    for (const surface of COURSE_DEFINITION.surfaces) {
      expect(getLieAt(surface.centre)).toBe(surface.lie);
    }
    expect(getLieAt(PIN_POSITION)).toBe('green');
  });

  it('keeps every authored feature inside any rendered map bounds', () => {
    const bounds = { x: 12, y: 82, width: 328, height: 148 };
    for (const point of [
      ...COURSE_DEFINITION.tees.map((tee) => tee.centre),
      ...COURSE_DEFINITION.surfaces.map((surface) => surface.centre),
      COURSE_DEFINITION.pin,
    ]) {
      const mapped = worldToMapWithin(point, bounds);
      expect(mapped.x).toBeGreaterThanOrEqual(bounds.x);
      expect(mapped.x).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(mapped.y).toBeGreaterThanOrEqual(bounds.y);
      expect(mapped.y).toBeLessThanOrEqual(bounds.y + bounds.height);
    }
  });

  it('gives bunker geometry priority where sand overlaps the green', () => {
    expect(getLieAt({ x: -59, y: 485 })).toBe('bunker');
    expect(getLieAt({ x: -30, y: 490 })).toBe('bunker');
    expect(getLieAt({ x: -2, y: 484 })).toBe('bunker');
  });
});
