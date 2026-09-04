import { describe, expect, it } from 'vitest';
import { isGameMuted, setGameMuted, toggleGameMuted } from './gameAudio';

describe('game audio preference', () => {
  it('toggles without requiring an AudioContext', () => {
    setGameMuted(false);
    expect(isGameMuted()).toBe(false);
    expect(toggleGameMuted()).toBe(true);
    expect(isGameMuted()).toBe(true);
    setGameMuted(false);
  });
});
