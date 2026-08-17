import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/createButton';

export class TitleScene extends Phaser.Scene {
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENES.title);
  }

  create(): void {
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

    this.drawGolferBadge();

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
      .text(GAME_WIDTH / 2, 421, 'PROJECT 1 · CHECKPOINT 2', {
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
    this.scene.start(SCENES.holeIntro);
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.marigold, 1);
    graphics.fillCircle(294, 56, 28);

    graphics.fillStyle(COLORS.rough, 1);
    graphics.fillTriangle(0, 262, 80, 182, 152, 262);
    graphics.fillTriangle(88, 262, 188, 168, 282, 262);
    graphics.fillTriangle(218, 262, 307, 194, 352, 232);

    graphics.fillStyle(COLORS.fairway, 1);
    graphics.fillRect(0, 249, GAME_WIDTH, GAME_HEIGHT - 249);
    graphics.fillStyle(COLORS.fairwayLight, 1);
    graphics.fillTriangle(125, GAME_HEIGHT, 208, 249, 280, GAME_HEIGHT);

    graphics.fillStyle(COLORS.water, 1);
    graphics.fillEllipse(38, 306, 122, 47);
  }

  private drawGolferBadge(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.cream, 1);
    graphics.fillCircle(176, 184, 17);
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillRect(160, 181, 29, 7);
    graphics.fillRect(162, 201, 28, 56);
    graphics.fillStyle(COLORS.tobacco, 1);
    graphics.fillRect(158, 247, 13, 45);
    graphics.fillRect(181, 247, 13, 45);
    graphics.lineStyle(4, COLORS.cream, 1);
    graphics.lineBetween(191, 210, 220, 245);
    graphics.lineBetween(220, 245, 225, 294);
    graphics.fillStyle(COLORS.cream, 1);
    graphics.fillCircle(225, 296, 4);
  }
}
