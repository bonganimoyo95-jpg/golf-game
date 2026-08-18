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
import {
  calculateShot,
  putterPowerForDistance,
  sampleTrajectory,
  type ShotResult,
} from '../physics/shotPhysics';
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

const PUTTING_BALL_SCREEN = { x: 250, y: 330 } as const;
const PUTTING_CUP_SCREEN = { x: 250, y: 246 } as const;
const PUTTING_HORIZON_Y = 225;
const PUTTING_METER_SPEED_MULTIPLIER = 0.55;

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
  private puttingGraphics!: Phaser.GameObjects.Graphics;
  private golferGraphics!: Phaser.GameObjects.Graphics;
  private puttingLabel!: Phaser.GameObjects.Text;
  private mapBall!: Phaser.GameObjects.Arc;
  private flightBall!: Phaser.GameObjects.Arc;
  private puttingBall!: Phaser.GameObjects.Arc;
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
      const advance = advancePowerPosition(this.meterPosition, this.meterDelta(delta));
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
        this.meterDelta(delta),
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
    this.puttingGraphics = this.add.graphics().setDepth(2);

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
    this.puttingBall = this.add
      .circle(PUTTING_BALL_SCREEN.x, PUTTING_BALL_SCREEN.y, 3, COLORS.white)
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

    this.puttingLabel = this.add
      .text(250, 246, 'PUTTING GREEN', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#24150f',
      })
      .setOrigin(0.5)
      .setDepth(5)
      .setVisible(false);
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
    const aimStep = this.currentLie === 'green' ? delta / 3 : delta;
    this.aimDegrees = Phaser.Math.Clamp(this.aimDegrees + aimStep, -30, 30);
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
    this.aimText.setText(
      `${this.currentLie === 'green' ? 'LINE' : 'AIM'} ${this.aimDegrees > 0 ? '+' : ''}${Math.round(this.aimDegrees)}°`,
    );
    this.lieText.setText(`LIE ${lieLabel(this.currentLie)}`);
    this.statusText.setText(`SHOT ${this.strokeCount + 1}`);
    this.distanceText.setText(this.distanceLabel(this.ballPosition));
    this.instructionText.setText(
      this.currentLie === 'green' ? 'READ THE LINE · SET PUTT POWER' : 'AIM · PICK CLUB · PRESS SWING',
    );
    this.meterLabel.setText('READY');
    this.meterPosition = 0;
    this.selectedPower = 0;
    this.drawPuttingView();
    this.drawAimGuide();
    this.drawMeter();
  }

  private drawAimGuide(): void {
    const projection = calculateShot({
      start: this.ballPosition,
      club: CLUBS[this.clubIndex],
      power: 1,
      accuracyError: 0,
      aimDegrees: this.shotAimDegrees(),
      wind: PROTOTYPE_HOLE.wind,
      startingLie: this.currentLie,
    });
    const start = worldToMap(this.ballPosition);
    const landing = worldToMap(projection.carryEnd);
    const final = worldToMap(projection.visualEnd);

    this.aimGraphics.clear();

    if (CLUBS[this.clubIndex].isPutter) {
      const pin = worldToMap(PIN_POSITION);
      this.aimGraphics.lineStyle(2, COLORS.cream, 0.9);
      this.aimGraphics.lineBetween(start.x, start.y, final.x, final.y);
      this.aimGraphics.lineStyle(1, COLORS.orange, 1);
      this.aimGraphics.strokeCircle(final.x, final.y, 6);
      this.aimGraphics.lineStyle(2, COLORS.white, 1);
      this.aimGraphics.strokeCircle(pin.x, pin.y, 4);
      return;
    }

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
      this.selectedPower = lockPowerAt(
        this.meterPosition,
        this.currentLie === 'green' ? 0.03 : undefined,
      );
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
      aimDegrees: this.shotAimDegrees(),
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
    const puttingEnd = result.club.isPutter
      ? this.puttingResultScreenPosition(result)
      : undefined;
    const sideViewStartX = result.club.isPutter ? PUTTING_BALL_SCREEN.x : 113;
    const sideViewStartY = result.club.isPutter ? PUTTING_BALL_SCREEN.y : 329;

    this.puttingBall.setVisible(false);
    this.flightBall.setPosition(sideViewStartX, sideViewStartY).setVisible(true);
    const animation = { progress: 0 };

    this.tweens.add({
      targets: animation,
      progress: 1,
      duration: result.animationDurationMs,
      ease: 'Linear',
      onUpdate: () => {
        const sample = sampleTrajectory(result, animation.progress);
        const mapPosition = worldToMap(sample);
        const sideViewX = result.club.isPutter
          ? Phaser.Math.Linear(sideViewStartX, puttingEnd!.x, animation.progress)
          : Phaser.Math.Linear(113, 330, animation.progress);
        const sideViewY = result.club.isPutter
          ? Phaser.Math.Linear(sideViewStartY, puttingEnd!.y, animation.progress)
          : 329 - Math.min(86, sample.height * 2.25);

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
    this.distanceText.setText(result.holed ? 'IN THE CUP' : this.distanceLabel(this.ballPosition));

    if (result.holed) {
      this.currentLie = 'green';
      this.instructionText.setText('IN THE CUP!');
      this.meterLabel.setText('HOLED');
      this.aimGraphics.clear();
      this.time.delayedCall(1350, () => {
        this.scene.start(SCENES.result, { strokes: this.strokeCount });
      });
      return;
    }

    if (result.penalty) {
      const penaltyLabel = lieLabel(result.finalLie);
      this.instructionText.setText(`${penaltyLabel} · +1 PENALTY · BALL RETURNED`);
    } else {
      this.instructionText.setText(
        `${Math.round(result.carryMetres)} CARRY + ${Math.round(result.rolloutMetres)} ROLL = ${Math.round(result.totalMetres)} M · ${lieLabel(result.finalLie)}`,
      );
    }

    this.aimDegrees = this.currentLie === 'green' ? 0 : this.directAimToPin();
    this.drawPuttingView();
    this.time.delayedCall(1650, () => {
      this.phase = 'setup';
      this.refreshSetupDisplay();
    });
  }

  private directAimToPin(): number {
    return Phaser.Math.Clamp(this.bearingToPin(), -30, 30);
  }

  private bearingToPin(): number {
    const lateral = PIN_POSITION.x - this.ballPosition.x;
    const forward = PIN_POSITION.y - this.ballPosition.y;
    return (Math.atan2(lateral, forward) * 180) / Math.PI;
  }

  private shotAimDegrees(): number {
    return this.currentLie === 'green'
      ? this.bearingToPin() + this.aimDegrees
      : this.aimDegrees;
  }

  private puttingResultScreenPosition(result: ShotResult): WorldPosition {
    if (result.holed) {
      return { ...PUTTING_CUP_SCREEN };
    }

    const distanceFromCup = distanceToPin(result.start);
    const distanceRatio =
      distanceFromCup > 0 ? result.totalMetres / distanceFromCup : 1;
    const cupBearing =
      (Math.atan2(
        PIN_POSITION.x - result.start.x,
        PIN_POSITION.y - result.start.y,
      ) *
        180) /
      Math.PI;
    let relativeAim = result.launchDirectionDegrees - cupBearing;
    while (relativeAim > 180) relativeAim -= 360;
    while (relativeAim < -180) relativeAim += 360;

    const forwardPixels =
      (PUTTING_BALL_SCREEN.y - PUTTING_CUP_SCREEN.y) *
      Phaser.Math.Clamp(distanceRatio, 0, 1.28);
    const lateralPixels = Math.tan((relativeAim * Math.PI) / 180) * forwardPixels;

    return {
      x: Phaser.Math.Clamp(PUTTING_BALL_SCREEN.x + lateralPixels, 164, 338),
      y: Math.max(PUTTING_HORIZON_Y + 2, PUTTING_BALL_SCREEN.y - forwardPixels),
    };
  }

  private meterDelta(delta: number): number {
    return this.currentLie === 'green'
      ? delta * PUTTING_METER_SPEED_MULTIPLIER
      : delta;
  }

  private distanceLabel(position: WorldPosition): string {
    const distance = distanceToPin(position);
    return `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} M LEFT`;
  }

  private drawPuttingView(): void {
    this.puttingGraphics.clear();
    const isPutting = this.currentLie === 'green';
    this.puttingLabel.setVisible(isPutting);
    this.golferGraphics.setVisible(!isPutting);
    this.puttingBall.setVisible(isPutting);

    if (!isPutting) {
      this.clubText.setVisible(true).setPosition(247, 216);
      this.lieText.setVisible(true).setPosition(178, 270).setOrigin(0, 0);
      this.aimText
        .setVisible(true)
        .setPosition(178, 286)
        .setOrigin(0, 0)
        .setText(`AIM ${this.aimDegrees > 0 ? '+' : ''}${Math.round(this.aimDegrees)}°`);
      this.instructionText.setPosition(250, 341);
      this.meterLabel.setPosition(250, 316);
      return;
    }

    const distance = distanceToPin(this.ballPosition);
    const targetPower = putterPowerForDistance(CLUBS[3], distance, 'green');

    this.clubText.setVisible(false);
    this.lieText.setVisible(false);
    this.aimText
      .setVisible(true)
      .setPosition(250, 217)
      .setOrigin(0.5, 0)
      .setText(`LINE ${this.aimDegrees > 0 ? '+' : ''}${Math.round(this.aimDegrees)}°`);
    this.instructionText.setPosition(250, 343);
    this.meterLabel.setPosition(92, 344);
    this.puttingLabel
      .setPosition(250, 205)
      .setText(`PUTT ${distance.toFixed(1)} M · TARGET ${Math.round(targetPower * 100)}%`);

    this.puttingGraphics.fillStyle(COLORS.green, 1);
    this.puttingGraphics.fillRoundedRect(9, 202, 334, 149, 5);
    this.puttingGraphics.fillStyle(COLORS.rough, 1);
    this.puttingGraphics.fillRect(10, 225, 332, 15);
    this.puttingGraphics.fillStyle(COLORS.fairwayLight, 0.18);
    this.puttingGraphics.fillTriangle(
      PUTTING_CUP_SCREEN.x,
      PUTTING_HORIZON_Y,
      132,
      350,
      342,
      350,
    );

    this.puttingGraphics.lineStyle(1, COLORS.cream, 0.28);
    for (const progress of [0.18, 0.34, 0.52, 0.7, 0.86, 1]) {
      const y = Phaser.Math.Linear(
        PUTTING_HORIZON_Y,
        PUTTING_BALL_SCREEN.y + 17,
        progress,
      );
      const left = Phaser.Math.Linear(PUTTING_CUP_SCREEN.x, 10, progress);
      const right = Phaser.Math.Linear(PUTTING_CUP_SCREEN.x, 342, progress);
      this.puttingGraphics.lineBetween(left, y, right, y);
    }
    for (const x of [12, 58, 104, 150, 196, 242, 288, 334]) {
      this.puttingGraphics.lineBetween(
        x,
        350,
        PUTTING_CUP_SCREEN.x,
        PUTTING_HORIZON_Y,
      );
    }

    const aimForwardPixels = PUTTING_BALL_SCREEN.y - PUTTING_CUP_SCREEN.y;
    const aimEndX =
      PUTTING_BALL_SCREEN.x +
      Math.tan((this.aimDegrees * Math.PI) / 180) * aimForwardPixels;
    this.puttingGraphics.lineStyle(5, COLORS.espresso, 0.32);
    this.puttingGraphics.lineBetween(
      PUTTING_BALL_SCREEN.x,
      PUTTING_BALL_SCREEN.y,
      aimEndX,
      PUTTING_CUP_SCREEN.y,
    );
    this.puttingGraphics.lineStyle(2, COLORS.cream, 0.92);
    this.puttingGraphics.lineBetween(
      PUTTING_BALL_SCREEN.x,
      PUTTING_BALL_SCREEN.y,
      aimEndX,
      PUTTING_CUP_SCREEN.y,
    );
    this.puttingGraphics.lineStyle(2, COLORS.orange, 1);
    this.puttingGraphics.strokeCircle(aimEndX, PUTTING_CUP_SCREEN.y, 6);

    this.puttingGraphics.fillStyle(COLORS.black, 1);
    this.puttingGraphics.fillEllipse(
      PUTTING_CUP_SCREEN.x,
      PUTTING_CUP_SCREEN.y,
      13,
      5,
    );
    this.puttingGraphics.lineStyle(2, COLORS.cream, 1);
    this.puttingGraphics.lineBetween(
      PUTTING_CUP_SCREEN.x,
      PUTTING_CUP_SCREEN.y,
      PUTTING_CUP_SCREEN.x,
      PUTTING_HORIZON_Y - 10,
    );
    this.puttingGraphics.fillStyle(COLORS.orange, 1);
    this.puttingGraphics.fillTriangle(
      PUTTING_CUP_SCREEN.x,
      PUTTING_HORIZON_Y - 10,
      PUTTING_CUP_SCREEN.x + 27,
      PUTTING_HORIZON_Y - 2,
      PUTTING_CUP_SCREEN.x,
      PUTTING_HORIZON_Y + 7,
    );

    this.puttingGraphics.fillStyle(COLORS.espresso, 0.28);
    this.puttingGraphics.fillEllipse(222, 334, 43, 10);
    this.puttingGraphics.fillStyle(COLORS.tobacco, 1);
    this.puttingGraphics.fillCircle(222, 274, 11);
    this.puttingGraphics.fillStyle(COLORS.orange, 1);
    this.puttingGraphics.fillRect(209, 270, 26, 6);
    this.puttingGraphics.fillRect(207, 286, 31, 33);
    this.puttingGraphics.fillStyle(COLORS.espresso, 1);
    this.puttingGraphics.fillRect(210, 316, 10, 25);
    this.puttingGraphics.fillRect(226, 316, 10, 25);
    this.puttingGraphics.lineStyle(4, COLORS.tobacco, 1);
    this.puttingGraphics.lineBetween(232, 293, 241, 310);
    this.puttingGraphics.lineBetween(241, 310, 247, 326);
    this.puttingGraphics.lineStyle(2, COLORS.cream, 1);
    this.puttingGraphics.lineBetween(247, 326, 251, 331);
    this.puttingGraphics.lineStyle(3, COLORS.espresso, 1);
    this.puttingGraphics.lineBetween(247, 331, 256, 331);
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
