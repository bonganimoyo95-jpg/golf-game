import { describe, expect, it } from 'vitest';
import {
  TUTORIAL_STEPS,
  markTutorialSeen,
  shouldShowTutorial,
} from './tutorial';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe('first-play tutorial', () => {
  it('contains the complete three-step game loop', () => {
    expect(TUTORIAL_STEPS).toHaveLength(3);
    expect(TUTORIAL_STEPS.map((step) => step.body).join(' ')).toContain('AUTO-CHIP');
  });

  it('shows once and persists completion', () => {
    const storage = memoryStorage();
    expect(shouldShowTutorial(storage)).toBe(true);
    markTutorialSeen(storage);
    expect(shouldShowTutorial(storage)).toBe(false);
  });
});
