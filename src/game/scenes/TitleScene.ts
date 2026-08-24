import Phaser from 'phaser';
import { ASSETS } from '../assets';
import { GAME_WIDTH, SCENES } from '../constants';
import { isQaMode } from '../qaMode';
import { QA_SCENARIO_REGISTRY_KEY } from '../qaScenarios';
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

    const qaMode = isQaMode();

    createButton(
      this,
      qaMode ? 119 : GAME_WIDTH / 2,
      353,
      qaMode ? 198 : 188,
      52,
      'PLAY PRACTICE',
      () => this.startGame(),
      { fontSize: '15px' },
    );

    if (qaMode) {
      createButton(this, 293, 353, 94, 52, 'QA LAB', () => this.startQa(), {
        fillColor: COLORS.brownLight,
        hoverColor: COLORS.marigold,
        textColor: '#f3e6c8',
        fontSize: '11px',
      });
    }

    this.add
      .text(GAME_WIDTH / 2, 391, 'TOUCH PLAY OR PRESS ENTER', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#c8b899',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 423, 'FAIRWAYS & FRIENDS · PRACTICE ROUND', {
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
    this.registry.remove(QA_SCENARIO_REGISTRY_KEY);
    this.scene.start(SCENES.loading, { nextScene: SCENES.golferSelect });
  }

  private startQa(): void {
    this.scene.start(SCENES.loading, { nextScene: SCENES.qa });
  }

  private drawBackdrop(): void {
    this.add
      .image(0, 0, ASSETS.titleCover)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, 440);

    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.espresso, 0.72);
    graphics.fillRect(0, 321, GAME_WIDTH, 119);
    graphics.lineStyle(2, COLORS.marigold, 0.72);
    graphics.lineBetween(0, 321, GAME_WIDTH, 321);
  }
}
