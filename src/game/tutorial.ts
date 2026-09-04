export const TUTORIAL_STORAGE_KEY = 'fairways-friends-tutorial-seen-v1';

export interface TutorialStep {
  title: string;
  body: string;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    title: '1 · PLAN THE SHOT',
    body: 'CHECK PIN DISTANCE, CHOOSE A CLUB, THEN AIM. RANGE SHOWS A PLAYABLE POWER WINDOW; FULL SHOWS THE CLUB LIMIT.',
  },
  {
    title: '2 · SET POWER',
    body: 'PRESS SWING. STOP THE RISING MARKER INSIDE THE SHADED RANGE. SHORT SHOTS NEED TOUCH—THE GAME WILL AUTO-CHIP NEAR THE GREEN.',
  },
  {
    title: '3 · MAKE CONTACT',
    body: 'STOP THE RETURNING MARKER AT THE WHITE CONTACT LINE. PURE CONTACT EARNS A SMALL DISTANCE BONUS. LONG PUTTS HAVE A TIGHTER WINDOW.',
  },
] as const;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function shouldShowTutorial(
  storage: StorageLike | undefined = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(TUTORIAL_STORAGE_KEY) !== 'yes';
  } catch {
    return false;
  }
}

export function markTutorialSeen(
  storage: StorageLike | undefined = browserStorage(),
): void {
  try {
    storage?.setItem(TUTORIAL_STORAGE_KEY, 'yes');
  } catch {
    // Storage is optional; the tutorial must never block the game.
  }
}
