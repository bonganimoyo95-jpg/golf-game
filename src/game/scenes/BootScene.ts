import Phaser from 'phaser';
import { BOOT_ASSET_PATHS } from '../assets';
import { SCENES } from '../constants';
import {
  DEFAULT_PLAYER_PROFILE,
  PLAYER_PROFILE_REGISTRY_KEY,
} from '../playerProfile';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    for (const [key, path] of BOOT_ASSET_PATHS) {
      this.load.image(key, path);
    }
  }

  create(): void {
    if (!this.registry.has(PLAYER_PROFILE_REGISTRY_KEY)) {
      this.registry.set(PLAYER_PROFILE_REGISTRY_KEY, { ...DEFAULT_PLAYER_PROFILE });
    }
    this.scene.start(SCENES.title);
  }
}
