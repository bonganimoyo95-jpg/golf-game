import { describe, expect, it } from 'vitest';
import {
  LATE_CONTACT_LIMIT,
  accuracyErrorAt,
  advanceDownswingPosition,
  advancePowerPosition,
  lockPowerAt,
  meterAngleForPosition,
  returnSpeedForPower,
} from './swingMeter';

describe('one-pass swing meter', () => {
  it('stops at maximum power instead of wrapping to the beginning', () => {
    const result = advancePowerPosition(0.92, 500);

    expect(result.position).toBe(1);
    expect(result.reachedMaximum).toBe(true);
  });

  it('locks partial power without moving the marker to maximum', () => {
    const lockedPosition = 0.63;

    expect(lockPowerAt(lockedPosition)).toBe(lockedPosition);
    expect(advanceDownswingPosition(lockedPosition, lockedPosition, 80).position).toBeLessThan(
      lockedPosition,
    );
  });

  it('makes a high-power return faster than a low-power return', () => {
    expect(returnSpeedForPower(0.95)).toBeGreaterThan(returnSpeedForPower(0.4));
  });

  it('continues past the contact line into a finite late-contact area', () => {
    const afterContact = advanceDownswingPosition(0.02, 0.8, 100);
    const missed = advanceDownswingPosition(afterContact.position, 0.8, 1000);

    expect(afterContact.position).toBeLessThan(0);
    expect(missed.position).toBe(LATE_CONTACT_LIMIT);
    expect(missed.missedContact).toBe(true);
  });

  it('maps early and late contact to opposite accuracy errors', () => {
    expect(accuracyErrorAt(0.12)).toBeGreaterThan(0);
    expect(accuracyErrorAt(-0.12)).toBeLessThan(0);
    expect(accuracyErrorAt(0)).toBe(0);
  });

  it('maps the late zone, contact line and maximum onto a 3/4-circle', () => {
    expect(meterAngleForPosition(LATE_CONTACT_LIMIT)).toBeCloseTo(0);
    expect(meterAngleForPosition(0)).toBeCloseTo(Math.PI / 2);
    expect(meterAngleForPosition(1)).toBeCloseTo(Math.PI * 1.5);
  });
});
