import Phaser from 'phaser';
import { drawCourseMapBase, drawLandscape } from '../courseArt';
import {
  PIN_POSITION,
  TEE_POSITION,
  distanceToPin,
  lieLabel,
  worldToMap,
  type WorldPosition,
} from '../courseModel';
import { CLUBS, PROTOTYPE_HOLE, type Lie } from '../data';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants';
import { calculateShot, sampleTrajectory, type ShotResult } from '../physics/shotPhysics';
import {
  LATE_CONTACT_LIMIT,
  accuracyErrorAt,
  advanceDownswingPosition,
  advancePowerPosition,
  lockPowerAt,
  meterAngleForPosition,
} from '../swingMeter';
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
  private ballPosition: WorldPosition = { ...TEE_POSITION };
  private currentLie: Lie = 'tee';

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;

  private statusText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private clubText!: Phaser.GameObjects.Text;
  private aimText!: Phaser.GameObjects.Text;
  private lieText!: Phaser.GameObjects.Text;
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
      const advance = advancePowerPosition(this.meterPosition, delta);
      this.meterPosition = advance.position;

      if (advance.reachedMaximum) {
        this.selectedPower = 1;
        this.phase = 'accuracy';
        this.instructionText.setText('MAX POWER · STOP AT THE WHITE LINE');
      }
      this.drawMeter();
    } else if (this.phase === 'accuracy') {
      const advance = advanceDownswingPosition(
        this.meterPosition,
        this.selectedPower,
        delta,
      );
      this.meterPosition = advance.position;
      this.drawMeter();

      if (advance.missedContact) {
        this.strikeBall(accuracyErrorAt(LATE_CONTACT_LIMIT));
      }
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
    this.ballPosition = { ...TEE_POSITION };
    this.currentLie = 'tee';
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
      .text(8, 7, `H${PROTOTYPE_HOLE.number}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setDepth(3);

    this.add
      .text(36, 7, `PAR ${PROTOTYPE_HOLE.par}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#d8a43e',
      })
      .setDepth(3);

    this.add
      .text(232, 7, `WIND ${PROTOTYPE_HOLE.wind.direction} ${PROTOTYPE_HOLE.wind.speed}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        color: '#c8b899',
      })
      .setDepth(3);
  }

  private createDynamicInterface(): void {
    this.statusText = this.add
      .text(87, 7, 'SHOT 1', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setDepth(3);

    this.distanceText = this.add
      .text(145, 7, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setDepth(3);

    this.aimGraphics = this.add.graphics().setDepth(4);
    this.meterGraphics = this.add.graphics().setDepth(3);

    const teeOnMap = worldToMap(this.ballPosition);
    this.mapBall = this.add
      .circle(teeOnMap.x, teeOnMap.y, 4, COLORS.white)
      .setStrokeStyle(1, COLORS.espresso)
      .setDepth(5);
    this.flightBall = this.add
      .circle(113, 329, 3, COLORS.white)
      .setStrokeStyle(1, COLORS.espresso)
      .setDepth(5)
      .setVisible(false);

    this.clubText = this.add
      .text(247, 216, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#24150f',
        backgroundColor: '#f3e6c8',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.lieText = this.add
      .text(178, 270, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#24150f',
      })
      .setDepth(5);

    this.aimText = this.add
      .text(178, 286, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#24150f',
      })
      .setDepth(5);

    this.instructionText = this.add
      .text(250, 341, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#24150f',
        align: 'center',
      })
      .setOrigin(0.5)
      .setWordWrapWidth(180)
      .setDepth(5);

    this.meterLabel = this.add
      .text(250, 316, '', {
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
    this.aimDegrees = Phaser.Math.Clamp(this.aimDegrees + delta, -30, 30);
    this.refreshSetupDisplay();
  }

  private changeClub(delta: number): void {
    if (this.phase !== 'setup') {
      return;
    }

    const allowedIndices = this.currentLie === 'green' ? [3] : [0, 1, 2];
    const currentAllowedPosition = Math.max(0, allowedIndices.indexOf(this.clubIndex));
    const nextAllowedPosition = Phaser.Math.Wrap(
      currentAllowedPosition + delta,
      0,
      allowedIndices.length,
    );
    this.clubIndex = allowedIndices[nextAllowedPosition];
    this.refreshSetupDisplay();
  }

  private refreshSetupDisplay(): void {
    if (this.currentLie === 'green') {
      this.clubIndex = 3;
    } else if (CLUBS[this.clubIndex].isPutter) {
      this.clubIndex = 2;
    }

    const club = CLUBS[this.clubIndex];
    const mapPosition = worldToMap(this.ballPosition);
    this.mapBall.setPosition(mapPosition.x, mapPosition.y);
    this.clubText.setText(
      club.isPutter
        ? `${club.shortName} · ${club.maxDistanceMetres} M`
        : `${club.shortName} · ${club.maxDistanceMetres} M · ${club.loftDegrees}°`,
    );
    this.aimText.setText(`AIM ${this.aimDegrees > 0 ? '+' : ''}${Math.round(this.aimDegrees)}°`);
    this.lieText.setText(`LIE ${lieLabel(this.currentLie)}`);
    this.statusText.setText(`SHOT ${this.strokeCount + 1}`);
    this.distanceText.setText(`${Math.round(distanceToPin(this.ballPosition))} M LEFT`);
    this.instructionText.setText('AIM · PICK CLUB · PRESS SWING');
    this.meterLabel.setText('READY');
    this.meterPosition = 0;
    this.selectedPower = 0;
    this.drawAimGuide();
    this.drawMeter();
  }

  private drawAimGuide(): void {
    const projection = calculateShot({
      start: this.ballPosition,
      club: CLUBS[this.clubIndex],
      power: 1,
      accuracyError: 0,
      aimDegrees: this.aimDegrees,
      wind: PROTOTYPE_HOLE.wind,
      startingLie: this.currentLie,
    });
    const start = worldToMap(this.ballPosition);
    const landing = worldToMap(projection.carryEnd);
    const final = worldToMap(projection.visualEnd);

    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(2, COLORS.cream, 0.82);
    this.aimGraphics.lineBetween(start.x, start.y, landing.x, landing.y);
    this.aimGraphics.lineStyle(1, COLORS.orange, 0.9);
    this.aimGraphics.lineBetween(landing.x, landing.y, final.x, final.y);
    this.aimGraphics.strokeCircle(landing.x, landing.y, 9);
    this.aimGraphics.lineBetween(landing.x - 4, landing.y, landing.x + 4, landing.y);
    this.aimGraphics.lineBetween(landing.x, landing.y - 4, landing.x, landing.y + 4);
  }

  private drawMeter(): void {
    const centreX = 92;
    const centreY = 281;
    const radius = 59;
    const contactAngle = Math.PI / 2;
    const maximumAngle = Math.PI * 1.5;
    const markerAngle = meterAngleForPosition(this.meterPosition);

    const drawArcSegment = (startAngle: number, endAngle: number, color: number): void => {
      this.meterGraphics.lineStyle(10, color, 1);
      this.meterGraphics.beginPath();
      this.meterGraphics.arc(centreX, centreY, radius, startAngle, endAngle, false);
      this.meterGraphics.strokePath();
    };

    const drawRadialLine = (
      angle: number,
      innerRadius: number,
      outerRadius: number,
      width: number,
      color: number,
    ): void => {
      this.meterGraphics.lineStyle(width, color, 1);
      this.meterGraphics.lineBetween(
        centreX + Math.cos(angle) * innerRadius,
        centreY + Math.sin(angle) * innerRadius,
        centreX + Math.cos(angle) * outerRadius,
        centreY + Math.sin(angle) * outerRadius,
      );
    };

    this.meterGraphics.clear();

    this.meterGraphics.lineStyle(14, COLORS.espresso, 0.92);
    this.meterGraphics.beginPath();
    this.meterGraphics.arc(centreX, centreY, radius, 0, maximumAngle, false);
    this.meterGraphics.strokePath();

    drawArcSegment(0, contactAngle, COLORS.fairway);
    drawArcSegment(contactAngle, Math.PI, COLORS.green);
    drawArcSegment(Math.PI, Math.PI * 1.25, COLORS.marigold);
    drawArcSegment(Math.PI * 1.25, Math.PI * 1.4, COLORS.orange);
    drawArcSegment(Math.PI * 1.4, maximumAngle, COLORS.red);

    drawRadialLine(Math.PI, radius - 8, radius + 8, 3, COLORS.creamMuted);
    drawRadialLine(Math.PI * 1.25, radius - 8, radius + 8, 3, COLORS.creamMuted);

    if (this.phase === 'power' || this.phase === 'accuracy') {
      drawRadialLine(markerAngle, radius - 10, radius + 10, 5, COLORS.espresso);
      drawRadialLine(markerAngle, radius - 8, radius + 8, 2, COLORS.cream);
    }

    drawRadialLine(contactAngle, radius - 12, radius + 12, 4, COLORS.white);

    this.meterGraphics.fillStyle(COLORS.espresso, 1);
    this.meterGraphics.fillCircle(centreX, centreY, 3);

    if (this.phase === 'power') {
      this.meterLabel.setText(`POWER ${Math.round(this.meterPosition * 100)}%`);
    } else if (this.phase === 'accuracy') {
      this.meterLabel.setText(`${Math.round(this.selectedPower * 100)}% · CONTACT`);
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
      this.selectedPower = 0;
      this.instructionText.setText('PRESS SWING ONCE TO SET POWER');
      this.drawMeter();
      return;
    }

    if (this.phase === 'power') {
      this.selectedPower = lockPowerAt(this.meterPosition);
      this.phase = 'accuracy';
      this.instructionText.setText('STOP THE RETURN AT THE WHITE LINE');
      this.drawMeter();
      return;
    }

    this.strikeBall(accuracyErrorAt(this.meterPosition));
  }

  private strikeBall(accuracyError: number): void {
    if (this.phase !== 'accuracy') {
      return;
    }

    const result = calculateShot({
      start: this.ballPosition,
      club: CLUBS[this.clubIndex],
      power: this.selectedPower,
      accuracyError,
      aimDegrees: this.aimDegrees,
      wind: PROTOTYPE_HOLE.wind,
      startingLie: this.currentLie,
    });

    this.phase = 'result';
    this.strokeCount += result.strokeCost;
    this.statusText.setText(`SHOT ${this.strokeCount}`);
    this.instructionText.setText(
      Math.abs(accuracyError) < 0.12
        ? 'PERFECT CONTACT!'
        : accuracyError > 0
          ? 'EARLY CONTACT!'
          : 'LATE CONTACT!',
    );
    this.aimGraphics.clear();
    this.launchCalculatedShot(result);
  }

  private launchCalculatedShot(result: ShotResult): void {
    this.flightBall.setPosition(113, 329).setVisible(true);
    const animation = { progress: 0 };

    this.tweens.add({
      targets: animation,
      progress: 1,
      duration: result.animationDurationMs,
      ease: 'Linear',
      onUpdate: () => {
        const sample = sampleTrajectory(result, animation.progress);
        const mapPosition = worldToMap(sample);
        const sideViewX = Phaser.Math.Linear(113, 330, animation.progress);
        const sideViewY = 329 - Math.min(86, sample.height * 2.25);

        this.mapBall.setPosition(mapPosition.x, mapPosition.y);
        this.flightBall.setPosition(sideViewX, sideViewY);
        this.meterLabel.setText(sample.phase.toUpperCase());
      },
      onComplete: () => {
        this.flightBall.setVisible(false);
        this.resolveCalculatedShot(result);
      },
    });
  }

  private resolveCalculatedShot(result: ShotResult): void {
    this.ballPosition = { ...result.resolvedEnd };
    this.currentLie = result.penalty ? result.startingLie : result.finalLie;
    const resolvedMapPosition = worldToMap(this.ballPosition);
    this.mapBall.setPosition(resolvedMapPosition.x, resolvedMapPosition.y);
    this.distanceText.setText(`${Math.round(distanceToPin(this.ballPosition))} M LEFT`);

    if (result.penalty) {
      const penaltyLabel = lieLabel(result.finalLie);
      this.instructionText.setText(`${penaltyLabel} · +1 PENALTY · BALL RETURNED`);
    } else {
      this.instructionText.setText(
        `${Math.round(result.carryMetres)} CARRY + ${Math.round(result.rolloutMetres)} ROLL = ${Math.round(result.totalMetres)} M · ${lieLabel(result.finalLie)}`,
      );
    }

    this.aimDegrees = this.directAimToPin();
    this.time.delayedCall(1650, () => {
      this.phase = 'setup';
      this.refreshSetupDisplay();
    });
  }

  private directAimToPin(): number {
    const lateral = PIN_POSITION.x - this.ballPosition.x;
    const forward = PIN_POSITION.y - this.ballPosition.y;
    const directDegrees = (Math.atan2(lateral, forward) * 180) / Math.PI;
    return Phaser.Math.Clamp(directDegrees, -30, 30);
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
