import { describe, expect, it } from 'vitest';
import { bestScoreForTee, recordBestScore } from './bestScore';

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

describe('local best score', () => {
  it('keeps independent bests for back and forward tees', () => {
    const storage = memoryStorage();
    expect(recordBestScore('back', 6, storage)).toEqual({ best: 6, isNewBest: true });
    expect(recordBestScore('back', 7, storage)).toEqual({ best: 6, isNewBest: false });
    expect(recordBestScore('forward', 5, storage)).toEqual({ best: 5, isNewBest: true });
    expect(bestScoreForTee('back', storage)).toBe(6);
    expect(bestScoreForTee('forward', storage)).toBe(5);
  });
});
