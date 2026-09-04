import type { TeeChoice } from './playerProfile';

export const BEST_SCORE_STORAGE_KEY = 'fairways-friends-best-scores-v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type StoredScores = Partial<Record<TeeChoice, number>>;

function browserStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readScores(storage: StorageLike | undefined): StoredScores {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(BEST_SCORE_STORAGE_KEY) ?? '{}') as StoredScores;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function bestScoreForTee(
  tee: TeeChoice,
  storage: StorageLike | undefined = browserStorage(),
): number | undefined {
  const score = readScores(storage)[tee];
  return Number.isFinite(score) && (score ?? 0) > 0 ? score : undefined;
}

export function recordBestScore(
  tee: TeeChoice,
  strokes: number,
  storage: StorageLike | undefined = browserStorage(),
): { best: number; isNewBest: boolean } {
  const validStrokes = Math.max(1, Math.round(strokes));
  const scores = readScores(storage);
  const previous = scores[tee];
  const isNewBest = previous === undefined || validStrokes < previous;
  const best = isNewBest ? validStrokes : previous;
  if (storage && isNewBest) {
    try {
      storage.setItem(BEST_SCORE_STORAGE_KEY, JSON.stringify({ ...scores, [tee]: best }));
    } catch {
      // Best scores are optional when browser storage is unavailable.
    }
  }
  return { best, isNewBest };
}
