import Phaser from 'phaser';
import { ASSETS, golferAsset } from '../assets';
import { GAME_WIDTH, SCENES } from '../constants';
import {
  PLAYER_PROFILE_REGISTRY_KEY,
  normalizePlayerProfile,
} from '../playerProfile';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/createButton';

export class TitleScene extends Phaser.Scene {
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENES.title);
  }

  create(): void {
    const profile = normalizePlayerProfile(
      this.registry.get(PLAYER_PROFILE_REGISTRY_KEY),
    );
    this.cameras.main.setBackgroundColor(COLORS.espresso);
    this.drawBackdrop();

    this.add
      .text(GAME_WIDTH / 2, 64, 'FAIRWAYS', {
        fontFamily: FONT_FAMILY,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#f3e6c8',
        stroke: '#24150f',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 101, '& FRIENDS', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#d8a43e',
        stroke: '#24150f',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 132, 'POCKET GOLF', {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#24150f',
        backgroundColor: '#f3e6c8',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);

    this.add
      .image(GAME_WIDTH / 2, 305, golferAsset(profile.gender, 'idle'))
      .setOrigin(0.5, 1)
      .setDisplaySize(112, 160)
      .setFlipX(profile.handedness === 'left')
      .setDepth(2);

    createButton(
      this,
      GAME_WIDTH / 2,
      342,
      188,
      52,
      'PLAY PRACTICE',
      () => this.startGame(),
      { fontSize: '15px' },
    );

    this.add
      .text(GAME_WIDTH / 2, 382, 'TOUCH PLAY OR PRESS ENTER', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#c8b899',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 421, 'PROJECT 1 · GAMEPLAY CORRECTION', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        color: '#76503a',
      })
      .setOrigin(0.5);

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.startGame();
    }
  }

  private startGame(): void {
    this.scene.start(SCENES.golferSelect);
  }

  private drawBackdrop(): void {
    this.add
      .image(0, 145, ASSETS.coursePanorama)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, 207);

    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.espresso, 0.18);
    graphics.fillRect(0, 145, GAME_WIDTH, 207);
    graphics.lineStyle(2, COLORS.cream, 0.65);
    graphics.lineBetween(0, 145, GAME_WIDTH, 145);
    graphics.lineBetween(0, 352, GAME_WIDTH, 352);
  }
}
