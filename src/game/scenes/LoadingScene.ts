import Phaser from 'phaser';
import { GAMEPLAY_ASSET_PATHS } from '../assets';
import { GAME_WIDTH, SCENES } from '../constants';
import { COLORS, FONT_FAMILY } from '../theme';

interface LoadingSceneData {
  nextScene?: string;
}

export class LoadingScene extends Phaser.Scene {
  private nextScene: string = SCENES.golferSelect;

  constructor() {
    super(SCENES.loading);
  }

  init(data: LoadingSceneData): void {
    this.nextScene = data.nextScene ?? SCENES.golferSelect;
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(COLORS.espresso);
    this.add
      .text(GAME_WIDTH / 2, 175, 'PREPARING THE COURSE', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);
    const track = this.add
      .rectangle(GAME_WIDTH / 2, 220, 246, 16, COLORS.tobacco)
      .setStrokeStyle(2, COLORS.cream);
    const fill = this.add
      .rectangle(track.x - 119, track.y, 1, 8, COLORS.marigold)
      .setOrigin(0, 0.5);
    const percentage = this.add
      .text(GAME_WIDTH / 2, 249, '0%', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#c8b899',
      })
      .setOrigin(0.5);

    this.load.on('progress', (progress: number) => {
      fill.setDisplaySize(Math.max(1, 238 * progress), 8);
      percentage.setText(`${Math.round(progress * 100)}%`);
    });

    for (const [key, path] of GAMEPLAY_ASSET_PATHS) {
      if (!this.textures.exists(key)) this.load.image(key, path);
    }
  }

  create(): void {
    this.scene.start(this.nextScene);
  }
}
