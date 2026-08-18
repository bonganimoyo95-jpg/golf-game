import Phaser from 'phaser';
import { ASSET_PATHS } from '../assets';
import { SCENES } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    for (const [key, path] of ASSET_PATHS) {
      this.load.image(key, path);
    }
  }

  create(): void {
    this.scene.start(SCENES.title);
  }
}
