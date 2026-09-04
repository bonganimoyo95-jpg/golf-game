import Phaser from 'phaser';
import { ASSETS } from '../assets';
import { GAME_WIDTH, SCENES } from '../constants';
import { isQaMode } from '../qaMode';
import { isGameMuted, toggleGameMuted } from '../gameAudio';
import { QA_SCENARIO_REGISTRY_KEY } from '../qaScenarios';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton, setButtonLabel } from '../ui/createButton';

export class TitleScene extends Phaser.Scene {
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENES.title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.espresso);
    this.drawBackdrop();

    const qaMode = isQaMode();

    const soundButton = createButton(
      this,
      316,
      22,
      58,
      30,
      isGameMuted() ? 'MUTED' : 'SOUND',
      () => {
        const nowMuted = toggleGameMuted();
        setButtonLabel(soundButton, nowMuted ? 'MUTED' : 'SOUND');
      },
      {
        fillColor: COLORS.brownLight,
        hoverColor: COLORS.marigold,
        textColor: '#f3e6c8',
        fontSize: '8px',
        depth: 5,
      },
    );

    createButton(
      this,
      qaMode ? 119 : GAME_WIDTH / 2,
      353,
      qaMode ? 198 : 188,
      52,
      'PLAY ROUND',
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
      .text(GAME_WIDTH / 2, 423, 'AZALEA BEND · ONE-HOLE CHALLENGE', {
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
    if (this.textures.exists(ASSETS.titleCover)) {
      this.add
        .image(0, 0, ASSETS.titleCover)
        .setOrigin(0)
        .setDisplaySize(GAME_WIDTH, 440);
    } else {
      const fallback = this.add.graphics();
      fallback.fillGradientStyle(
        COLORS.espresso,
        COLORS.espresso,
        COLORS.rough,
        COLORS.rough,
        1,
      );
      fallback.fillRect(0, 0, GAME_WIDTH, 440);
      this.add
        .text(GAME_WIDTH / 2, 170, 'FAIRWAYS & FRIENDS\nPOCKET GOLF', {
          fontFamily: FONT_FAMILY,
          fontSize: '24px',
          fontStyle: 'bold',
          align: 'center',
          color: '#f3e6c8',
        })
        .setOrigin(0.5);
    }

    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.espresso, 0.72);
    graphics.fillRect(0, 321, GAME_WIDTH, 119);
    graphics.lineStyle(2, COLORS.marigold, 0.72);
    graphics.lineBetween(0, 321, GAME_WIDTH, 321);
  }
}
