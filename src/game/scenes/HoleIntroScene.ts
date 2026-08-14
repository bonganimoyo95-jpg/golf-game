import Phaser from 'phaser';
import { drawCourseMapBase } from '../courseArt';
import { PROTOTYPE_HOLE } from '../data';
import { GAME_WIDTH, SCENES } from '../constants';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/createButton';

export class HoleIntroScene extends Phaser.Scene {
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENES.holeIntro);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.espresso);

    this.add
      .text(GAME_WIDTH / 2, 31, `HOLE ${PROTOTYPE_HOLE.number}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '25px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 59, PROTOTYPE_HOLE.name.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#d8a43e',
      })
      .setOrigin(0.5);

    drawCourseMapBase(this, { x: 82, y: 82, width: 188, height: 226 });

    this.add
      .text(GAME_WIDTH / 2, 330, `PAR ${PROTOTYPE_HOLE.par}  ·  ${PROTOTYPE_HOLE.distanceMetres} M`, {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        354,
        `WIND ${PROTOTYPE_HOLE.wind.direction} ${PROTOTYPE_HOLE.wind.speed} KM/H`,
        {
          fontFamily: FONT_FAMILY,
          fontSize: '11px',
          color: '#c8b899',
        },
      )
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, 402, 168, 48, 'TEE OFF', () => this.teeOff());

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.teeOff();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.scene.start(SCENES.title);
    }
  }

  private teeOff(): void {
    this.scene.start(SCENES.game);
  }
}
