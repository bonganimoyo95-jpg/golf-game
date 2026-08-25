export interface SceneClockLike {
  paused: boolean;
}

export interface SceneTweensLike {
  resumeAll(): unknown;
}

export function resumeSceneSystems(
  clock: SceneClockLike,
  tweens: SceneTweensLike,
): void {
  clock.paused = false;
  tweens.resumeAll();
}
