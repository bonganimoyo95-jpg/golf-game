import type { Lie } from './data';

type AudioContextWithWebkit = typeof AudioContext & {
  webkitAudioContext?: typeof AudioContext;
};

let sharedContext: AudioContext | undefined;
let muted: boolean | undefined;
export const AUDIO_MUTED_STORAGE_KEY = 'fairways-friends-audio-muted-v1';

export function isGameMuted(): boolean {
  if (muted !== undefined) return muted;
  if (typeof window === 'undefined') return false;
  try {
    muted = window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === 'yes';
  } catch {
    muted = false;
  }
  return muted;
}

export function setGameMuted(value: boolean): boolean {
  muted = value;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, value ? 'yes' : 'no');
    } catch {
      // Audio still toggles for this session when storage is unavailable.
    }
  }
  return muted;
}

export function toggleGameMuted(): boolean {
  return setGameMuted(!isGameMuted());
}

function audioContext(): AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  const browserWindow = window as typeof window & {
    webkitAudioContext?: AudioContextWithWebkit;
  };
  const Context = window.AudioContext ?? browserWindow.webkitAudioContext;
  if (!Context) return undefined;
  sharedContext ??= new Context();
  if (sharedContext.state === 'suspended') void sharedContext.resume();
  return sharedContext;
}

export function unlockGameAudio(): void {
  if (!isGameMuted()) audioContext();
}

function tone(
  startFrequency: number,
  endFrequency: number,
  durationSeconds: number,
  volume: number,
  type: OscillatorType,
  delaySeconds = 0,
): void {
  if (isGameMuted()) return;
  const context = audioContext();
  if (!context) return;
  const startsAt = context.currentTime + delaySeconds;
  const endsAt = startsAt + durationSeconds;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(1, startFrequency), startsAt);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endFrequency),
    endsAt,
  );
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), startsAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startsAt);
  oscillator.stop(endsAt + 0.02);
}

export function playSwingWhoosh(): void {
  tone(260, 84, 0.13, 0.025, 'triangle');
}

export function playFullImpact(contactQuality: number): void {
  const quality = Math.max(0, Math.min(1, contactQuality));
  tone(118 + quality * 34, 54, 0.095, 0.035 + quality * 0.018, 'square');
  if (quality > 0.62) tone(820, 410, 0.075, 0.014, 'sine', 0.006);
}

export function playPuttContact(): void {
  tone(520, 340, 0.055, 0.02, 'triangle');
}

export function playLanding(lie: Lie): void {
  if (lie === 'water') {
    tone(240, 110, 0.18, 0.025, 'sine');
    tone(410, 180, 0.12, 0.014, 'sine', 0.035);
    return;
  }
  if (lie === 'bunker') {
    tone(105, 48, 0.16, 0.025, 'sawtooth');
    return;
  }
  if (lie === 'green') {
    tone(290, 210, 0.05, 0.012, 'triangle');
    return;
  }
  if (lie === 'fairway' || lie === 'rough' || lie === 'tee') {
    tone(150, 76, 0.075, 0.018, 'triangle');
  }
}

export function playCupDrop(): void {
  tone(660, 440, 0.08, 0.023, 'sine');
  tone(880, 660, 0.11, 0.017, 'sine', 0.045);
}
