import Phaser from 'phaser';
import { GAME_WIDTH, SCENES } from '../constants';
import { PROTOTYPE_HOLE } from '../data';
import { scoreHole } from '../scoring';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/createButton';

interface ResultSceneData {
  strokes?: number;
}

export class ResultScene extends Phaser.Scene {
  private strokes: number = PROTOTYPE_HOLE.par;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENES.result);
  }

  init(data: ResultSceneData): void {
    this.strokes = Math.max(1, Math.round(data.strokes ?? PROTOTYPE_HOLE.par));
  }

  create(): void {
    const score = scoreHole(this.strokes, PROTOTYPE_HOLE.par);
    this.cameras.main.setBackgroundColor(COLORS.espresso);
    this.drawBackdrop();

    this.add
      .text(GAME_WIDTH / 2, 50, 'HOLE COMPLETE', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 82, `HOLE ${PROTOTYPE_HOLE.number} · PAR ${PROTOTYPE_HOLE.par}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        color: '#d8a43e',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 172, `${this.strokes}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#24150f',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 216, 'STROKES', {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#5b3929',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 263, `${score.label}  ·  ${score.display}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, 326, 190, 50, 'PLAY AGAIN', () => this.playAgain(), {
      fontSize: '14px',
    });
    createButton(this, GAME_WIDTH / 2, 386, 190, 44, 'TITLE SCREEN', () => this.goToTitle(), {
      fillColor: COLORS.brownLight,
      hoverColor: COLORS.marigold,
      textColor: '#f3e6c8',
      fontSize: '11px',
    });

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.playAgain();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.goToTitle();
    }
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.tobacco, 1);
    graphics.fillRoundedRect(22, 111, GAME_WIDTH - 44, 176, 12);
    graphics.fillStyle(COLORS.green, 1);
    graphics.fillEllipse(GAME_WIDTH / 2, 182, 208, 138);
    graphics.fillStyle(COLORS.black, 1);
    graphics.fillEllipse(GAME_WIDTH / 2, 219, 30, 10);
    graphics.lineStyle(4, COLORS.cream, 1);
    graphics.lineBetween(GAME_WIDTH / 2, 205, GAME_WIDTH / 2, 126);
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillTriangle(
      GAME_WIDTH / 2,
      126,
      GAME_WIDTH / 2 + 46,
      141,
      GAME_WIDTH / 2,
      155,
    );
  }

  private playAgain(): void {
    this.scene.start(SCENES.holeIntro);
  }

  private goToTitle(): void {
    this.scene.start(SCENES.title);
  }
}
