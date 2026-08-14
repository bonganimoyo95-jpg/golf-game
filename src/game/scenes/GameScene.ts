import Phaser from 'phaser';
import { drawCourseMapBase, drawLandscape } from '../courseArt';
import { CLUBS, PROTOTYPE_HOLE } from '../data';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/createButton';

type SwingPhase = 'setup' | 'power' | 'accuracy' | 'result' | 'paused';

export class GameScene extends Phaser.Scene {
  private phase: SwingPhase = 'setup';
  private phaseBeforePause: Exclude<SwingPhase, 'paused'> = 'setup';
  private aimDegrees = 0;
  private clubIndex = 0;
  private strokeCount = 0;
  private meterPosition = 0;
  private selectedPower = 0;
  private lastSwingInputAt = -1000;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;

  private statusText!: Phaser.GameObjects.Text;
  private clubText!: Phaser.GameObjects.Text;
  private aimText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private meterLabel!: Phaser.GameObjects.Text;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private meterGraphics!: Phaser.GameObjects.Graphics;
  private golferGraphics!: Phaser.GameObjects.Graphics;
  private mapBall!: Phaser.GameObjects.Arc;
  private flightBall!: Phaser.GameObjects.Arc;
  private pauseObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(SCENES.game);
  }

  create(): void {
    this.resetState();
    this.cameras.main.setBackgroundColor(COLORS.espresso);
    this.drawStaticInterface();
    this.createDynamicInterface();
    this.createTouchControls();
    this.bindKeyboard();
    this.refreshSetupDisplay();
  }

  update(_time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.togglePause();
      return;
    }

    if (this.phase === 'paused') {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
      return;
    }

    if (this.phase === 'setup') {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.changeAim(-3);
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.changeAim(3);
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.changeClub(1);
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this.changeClub(-1);
      }
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.enterKey)
    ) {
      this.handleSwingInput();
    }

    if (this.phase === 'power') {
      this.meterPosition += delta * 0.00072;
      if (this.meterPosition > 1) {
        this.meterPosition = 0;
      }
      this.drawMeter();
    } else if (this.phase === 'accuracy') {
      this.meterPosition -= delta * 0.00092;
      if (this.meterPosition < 0) {
        this.meterPosition = 1;
      }
      this.drawMeter();
    }
  }

  private resetState(): void {
    this.phase = 'setup';
    this.phaseBeforePause = 'setup';
    this.aimDegrees = 0;
    this.clubIndex = 0;
    this.strokeCount = 0;
    this.meterPosition = 0;
    this.selectedPower = 0;
    this.lastSwingInputAt = -1000;
    this.pauseObjects = [];
  }

  private drawStaticInterface(): void {
    const frame = this.add.graphics();
    frame.fillStyle(COLORS.tobacco, 1);
    frame.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    frame.fillStyle(COLORS.espresso, 1);
    frame.fillRect(0, 0, GAME_WIDTH, 40);
    frame.fillRect(0, 354, GAME_WIDTH, 86);

    drawCourseMapBase(this, { x: 8, y: 43, width: 336, height: 151 });
    drawLandscape(this);
    this.drawGolfer();

    this.add
      .text(8, 8, `HOLE ${PROTOTYPE_HOLE.number}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setDepth(3);

    this.add
      .text(67, 8, `PAR ${PROTOTYPE_HOLE.par}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#d8a43e',
      })
      .setDepth(3);

    this.add
      .text(227, 8, `WIND ${PROTOTYPE_HOLE.wind.direction} ${PROTOTYPE_HOLE.wind.speed}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        color: '#c8b899',
      })
      .setDepth(3);
  }

  private createDynamicInterface(): void {
    this.statusText = this.add
      .text(118, 8, 'SHOT 1', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setDepth(3);

    this.aimGraphics = this.add.graphics().setDepth(4);
    this.meterGraphics = this.add.graphics().setDepth(4);

    this.mapBall = this.add.circle(176, 177, 4, COLORS.white).setStrokeStyle(1, COLORS.espresso).setDepth(5);
    this.flightBall = this.add.circle(113, 293, 3, COLORS.white).setDepth(5).setVisible(false);

    this.clubText = this.add
      .text(176, 211, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#24150f',
        backgroundColor: '#f3e6c8',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.aimText = this.add
      .text(16, 329, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setDepth(5);

    this.instructionText = this.add
      .text(176, 337, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#24150f',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.meterLabel = this.add
      .text(246, 329, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#24150f',
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  private createTouchControls(): void {
    createButton(this, 32, 398, 60, 52, 'CLUB', () => this.changeClub(1), {
      fillColor: COLORS.marigold,
      hoverColor: COLORS.cream,
      fontSize: '12px',
    });
    createButton(this, 89, 398, 52, 52, '◀', () => this.changeAim(-3), {
      fillColor: COLORS.brownLight,
      hoverColor: COLORS.marigold,
      textColor: '#f3e6c8',
      fontSize: '17px',
    });
    createButton(this, 176, 398, 118, 52, 'SWING', () => this.handleSwingInput(), {
      fontSize: '15px',
    });
    createButton(this, 263, 398, 52, 52, '▶', () => this.changeAim(3), {
      fillColor: COLORS.brownLight,
      hoverColor: COLORS.marigold,
      textColor: '#f3e6c8',
      fontSize: '17px',
    });
    createButton(this, 321, 398, 60, 52, 'RESET', () => this.scene.restart(), {
      fillColor: COLORS.brownLight,
      hoverColor: COLORS.red,
      textColor: '#f3e6c8',
      fontSize: '10px',
    });
    createButton(this, 324, 26, 52, 52, 'Ⅱ', () => this.togglePause(), {
      fillColor: COLORS.brownLight,
      hoverColor: COLORS.marigold,
      textColor: '#f3e6c8',
      borderColor: COLORS.tobacco,
      fontSize: '12px',
      depth: 8,
    });
  }

  private bindKeyboard(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  private changeAim(delta: number): void {
    if (this.phase !== 'setup') {
      return;
    }
    this.aimDegrees = Phaser.Math.Clamp(this.aimDegrees + delta, -24, 24);
    this.refreshSetupDisplay();
  }

  private changeClub(delta: number): void {
    if (this.phase !== 'setup') {
      return;
    }
    this.clubIndex = Phaser.Math.Wrap(this.clubIndex + delta, 0, CLUBS.length);
    this.refreshSetupDisplay();
  }

  private refreshSetupDisplay(): void {
    const club = CLUBS[this.clubIndex];
    this.clubText.setText(`${club.shortName} · ${club.maxDistanceMetres} M`);
    this.aimText.setText(`AIM ${this.aimDegrees > 0 ? '+' : ''}${this.aimDegrees}°`);
    this.statusText.setText(`SHOT ${this.strokeCount + 1}`);
    this.instructionText.setText('AIM · PICK CLUB · PRESS SWING');
    this.meterLabel.setText('READY');
    this.meterPosition = 0;
    this.drawAimGuide();
    this.drawMeter();
  }

  private drawAimGuide(): void {
    const clubLandingY = [68, 92, 118, 145][this.clubIndex];
    const targetX = 176 + this.aimDegrees * 2.1;

    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(2, COLORS.cream, 0.85);
    this.aimGraphics.lineBetween(176, 177, targetX, clubLandingY);
    this.aimGraphics.lineStyle(1, COLORS.orange, 0.9);
    this.aimGraphics.strokeCircle(targetX, clubLandingY, 10);
    this.aimGraphics.lineBetween(targetX - 4, clubLandingY, targetX + 4, clubLandingY);
    this.aimGraphics.lineBetween(targetX, clubLandingY - 4, targetX, clubLandingY + 4);
  }

  private drawMeter(): void {
    const centreX = 246;
    const centreY = 306;
    const radius = 35;
    const angle = Math.PI + this.meterPosition * Math.PI;
    const markerX = centreX + Math.cos(angle) * radius;
    const markerY = centreY + Math.sin(angle) * radius;

    this.meterGraphics.clear();
    this.meterGraphics.lineStyle(8, COLORS.tobacco, 1);
    this.meterGraphics.beginPath();
    this.meterGraphics.arc(centreX, centreY, radius, Math.PI, Math.PI * 2, false);
    this.meterGraphics.strokePath();

    this.meterGraphics.lineStyle(6, COLORS.marigold, 1);
    this.meterGraphics.beginPath();
    this.meterGraphics.arc(centreX, centreY, radius, Math.PI * 1.45, Math.PI * 1.55, false);
    this.meterGraphics.strokePath();

    this.meterGraphics.fillStyle(COLORS.orange, 1);
    this.meterGraphics.fillCircle(markerX, markerY, 5);
    this.meterGraphics.lineStyle(1, COLORS.cream, 1);
    this.meterGraphics.strokeCircle(markerX, markerY, 5);

    if (this.phase === 'power') {
      this.meterLabel.setText(`POWER ${Math.round(this.meterPosition * 100)}%`);
    } else if (this.phase === 'accuracy') {
      this.meterLabel.setText('ACCURACY');
    }
  }

  private handleSwingInput(): void {
    if (this.phase === 'paused' || this.phase === 'result') {
      return;
    }

    const now = this.time.now;
    if (now - this.lastSwingInputAt < 160) {
      return;
    }
    this.lastSwingInputAt = now;

    if (this.phase === 'setup') {
      this.phase = 'power';
      this.meterPosition = 0;
      this.instructionText.setText('PRESS SWING TO LOCK POWER');
      this.drawMeter();
      return;
    }

    if (this.phase === 'power') {
      this.selectedPower = Math.max(0.15, this.meterPosition);
      this.phase = 'accuracy';
      this.meterPosition = 1;
      this.instructionText.setText('PRESS SWING NEAR THE CENTRE');
      this.drawMeter();
      return;
    }

    const accuracyError = (this.meterPosition - 0.5) * 2;
    this.phase = 'result';
    this.strokeCount += 1;
    this.statusText.setText(`SHOT ${this.strokeCount}`);
    this.instructionText.setText(Math.abs(accuracyError) < 0.12 ? 'PERFECT!' : 'SHOT AWAY!');
    this.launchShotPreview(accuracyError);
  }

  private launchShotPreview(accuracyError: number): void {
    const club = CLUBS[this.clubIndex];
    const distance = Math.round(club.maxDistanceMetres * (0.45 + this.selectedPower * 0.55));
    const baseLandingY = [68, 92, 118, 145][this.clubIndex];
    const landingX = Phaser.Math.Clamp(
      176 + this.aimDegrees * 2.1 + accuracyError * 38,
      24,
      328,
    );

    this.flightBall.setPosition(113, 293).setVisible(true);
    const flight = { progress: 0 };
    this.tweens.add({
      targets: flight,
      progress: 1,
      duration: 900,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const progress = flight.progress;
        this.flightBall.setPosition(
          Phaser.Math.Linear(113, 326, progress),
          Phaser.Math.Linear(293, 278, progress) - Math.sin(progress * Math.PI) * 82,
        );
      },
      onComplete: () => this.flightBall.setVisible(false),
    });

    this.tweens.add({
      targets: this.mapBall,
      x: landingX,
      y: baseLandingY,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.instructionText.setText(`PREVIEW: ${distance} M · PHYSICS COMES NEXT`);
        this.time.delayedCall(1200, () => {
          this.mapBall.setPosition(176, 177);
          this.phase = 'setup';
          this.refreshSetupDisplay();
        });
      },
    });
  }

  private drawGolfer(): void {
    this.golferGraphics = this.add.graphics().setDepth(4);
    this.golferGraphics.fillStyle(COLORS.tobacco, 1);
    this.golferGraphics.fillCircle(82, 258, 11);
    this.golferGraphics.fillStyle(COLORS.orange, 1);
    this.golferGraphics.fillRect(70, 255, 22, 5);
    this.golferGraphics.fillRect(72, 271, 21, 35);
    this.golferGraphics.fillStyle(COLORS.espresso, 1);
    this.golferGraphics.fillRect(71, 302, 8, 28);
    this.golferGraphics.fillRect(86, 302, 8, 28);
    this.golferGraphics.lineStyle(3, COLORS.espresso, 1);
    this.golferGraphics.lineBetween(92, 278, 111, 296);
    this.golferGraphics.lineBetween(111, 296, 116, 327);
    this.golferGraphics.fillStyle(COLORS.white, 1);
    this.golferGraphics.fillCircle(113, 329, 3);
  }

  private togglePause(): void {
    if (this.phase === 'paused') {
      this.resumeGame();
      return;
    }

    this.phaseBeforePause = this.phase;
    this.phase = 'paused';
    this.tweens.pauseAll();

    const blocker = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.black, 0.78)
      .setInteractive()
      .setDepth(100);
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, 220, 270, 252, COLORS.espresso, 1)
      .setStrokeStyle(3, COLORS.cream)
      .setDepth(101);
    const title = this.add
      .text(GAME_WIDTH / 2, 129, 'PAUSED', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5)
      .setDepth(102);
    const resume = createButton(this, GAME_WIDTH / 2, 188, 176, 46, 'RESUME', () => this.resumeGame(), {
      depth: 102,
    });
    const restart = createButton(
      this,
      GAME_WIDTH / 2,
      247,
      176,
      46,
      'RESTART HOLE',
      () => this.scene.restart(),
      { fillColor: COLORS.marigold, hoverColor: COLORS.cream, depth: 102, fontSize: '12px' },
    );
    const exit = createButton(
      this,
      GAME_WIDTH / 2,
      306,
      176,
      46,
      'EXIT TO TITLE',
      () => this.scene.start(SCENES.title),
      {
        fillColor: COLORS.brownLight,
        hoverColor: COLORS.red,
        textColor: '#f3e6c8',
        depth: 102,
        fontSize: '12px',
      },
    );

    this.pauseObjects = [blocker, panel, title, resume, restart, exit];
  }

  private resumeGame(): void {
    for (const object of this.pauseObjects) {
      object.destroy();
    }
    this.pauseObjects = [];
    this.phase = this.phaseBeforePause;
    this.tweens.resumeAll();
  }
}
