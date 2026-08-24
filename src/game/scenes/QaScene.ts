import Phaser from 'phaser';
import { GAME_WIDTH, SCENES } from '../constants';
import { drawCourseMapBase } from '../courseArt';
import {
  QA_SCENARIOS,
  QA_SCENARIO_REGISTRY_KEY,
  type QaScenario,
} from '../qaScenarios';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/createButton';

export class QaScene extends Phaser.Scene {
  private escapeKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENES.qa);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.espresso);
    this.add
      .text(GAME_WIDTH / 2, 25, 'QA SCENARIOS', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 50, 'START DIRECTLY FROM A GAMEPLAY SEAM', {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#d8a43e',
      })
      .setOrigin(0.5);

    drawCourseMapBase(this, { x: 12, y: 66, width: 328, height: 112 });

    QA_SCENARIOS.forEach((scenario, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      createButton(
        this,
        column === 0 ? 92 : 260,
        207 + row * 43,
        148,
        34,
        scenario.label,
        () => this.startScenario(scenario),
        {
          fillColor: row % 2 === 0 ? COLORS.orange : COLORS.brownLight,
          hoverColor: COLORS.marigold,
          textColor: row % 2 === 0 ? '#24150f' : '#f3e6c8',
          fontSize: '9px',
        },
      );
    });

    createButton(this, GAME_WIDTH / 2, 402, 172, 38, 'BACK TO TITLE', () => {
      this.scene.start(SCENES.title);
    }, {
      fillColor: COLORS.tobacco,
      hoverColor: COLORS.brownLight,
      textColor: '#f3e6c8',
      fontSize: '10px',
    });

    this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.scene.start(SCENES.title);
    }
  }

  private startScenario(scenario: QaScenario): void {
    this.registry.set(QA_SCENARIO_REGISTRY_KEY, scenario.id);
    this.scene.start(SCENES.game);
  }
}
