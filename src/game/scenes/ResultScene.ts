import Phaser from 'phaser';
import { ASSETS, golferAsset } from '../assets';
import { GAME_WIDTH, SCENES } from '../constants';
import { PROTOTYPE_HOLE } from '../data';
import { scoreHole } from '../scoring';
import {
  PLAYER_PROFILE_REGISTRY_KEY,
  normalizePlayerProfile,
} from '../playerProfile';
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
    const profile = normalizePlayerProfile(
      this.registry.get(PLAYER_PROFILE_REGISTRY_KEY),
    );
    this.cameras.main.setBackgroundColor(COLORS.espresso);
    this.drawBackdrop();

    this.add
      .image(
        91,
        281,
        golferAsset(
          profile.gender,
          score.relativeToPar < 0 ? 'celebrate' : 'neutral',
        ),
      )
      .setOrigin(0.5, 1)
      .setDisplaySize(108, 154)
      .setFlipX(profile.handedness === 'left')
      .setDepth(2);

    this.add
      .text(GAME_WIDTH / 2, 42, 'HOLE COMPLETE', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 73, `HOLE ${PROTOTYPE_HOLE.number} · PAR ${PROTOTYPE_HOLE.par}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        color: '#d8a43e',
      })
      .setOrigin(0.5);

    this.add
      .text(245, 164, `${this.strokes}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#24150f',
      })
      .setOrigin(0.5);

    this.add
      .text(245, 207, 'STROKES', {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#5b3929',
      })
      .setOrigin(0.5);

    this.add
      .text(245, 247, `${score.label}  ·  ${score.display}`, {
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
    this.add
      .image(0, 0, ASSETS.coursePanorama)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, 180);

    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.espresso, 0.58);
    graphics.fillRect(0, 0, GAME_WIDTH, 180);
    graphics.fillStyle(COLORS.tobacco, 1);
    graphics.fillRoundedRect(18, 104, GAME_WIDTH - 36, 184, 12);
    graphics.lineStyle(2, COLORS.cream, 0.72);
    graphics.strokeRoundedRect(18, 104, GAME_WIDTH - 36, 184, 12);
    graphics.lineStyle(1, COLORS.marigold, 0.7);
    graphics.lineBetween(165, 126, 165, 270);
  }

  private playAgain(): void {
    this.scene.start(SCENES.holeIntro);
  }

  private goToTitle(): void {
    this.scene.start(SCENES.title);
  }
}
