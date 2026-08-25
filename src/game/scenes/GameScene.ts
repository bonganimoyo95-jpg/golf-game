import Phaser from 'phaser';
import { golferAsset, type GolferPose } from '../assets';
import {
  COURSE_VIEW_CENTRE_X,
  LANDSCAPE_GROUND_Y,
  ballAddressScreenX,
  courseViewStage,
  puttingAimTargetScreenPosition,
  puttingRollScreenPosition,
  shotCameraForSample,
  shotBallScreenPosition,
} from '../cameraModel';
import {
  drawCourseMapBase,
  drawCoursePerspective,
  drawLandscapeFrame,
} from '../courseArt';
import {
  PIN_POSITION,
  distanceToPin,
  getLieAt,
  lieLabel,
  teePositionForChoice,
  worldToMap,
  type WorldPosition,
} from '../courseModel';
import { CLUBS, PROTOTYPE_HOLE, type ClubDefinition, type Lie } from '../data';
import {
  allowedClubIndices,
  nextAllowedClubIndex,
  recommendedClubIndex,
} from '../gameRules';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants';
import {
  calculateShot,
  putterPowerForDistance,
  sampleTrajectory,
  type ShotResult,
} from '../physics/shotPhysics';
import {
  PLAYER_PROFILE_REGISTRY_KEY,
  clubForProfile,
  normalizePlayerProfile,
  type PlayerProfile,
} from '../playerProfile';
import { isQaMode } from '../qaMode';
import {
  QA_SCENARIO_REGISTRY_KEY,
  resolveQaScenario,
  type ResolvedQaScenario,
} from '../qaScenarios';
import {
  appendReplayShot,
  createReplaySession,
  saveReplay,
  serializeReplay,
  type ReplaySession,
} from '../replayLog';
import { resumeSceneSystems } from '../sceneMotion';
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

const GROUND_Y = LANDSCAPE_GROUND_Y;
const PUTTING_METER_SPEED_MULTIPLIER = 0.55;
const METER_RADIUS = 47;

export class GameScene extends Phaser.Scene {
  private profile: PlayerProfile = {
    gender: 'male',
    handedness: 'right',
    tee: 'back',
  };
  private phase: SwingPhase = 'setup';
  private phaseBeforePause: Exclude<SwingPhase, 'paused'> = 'setup';
  private aimDegrees = 0;
  private clubIndex = 0;
  private strokeCount = 0;
  private meterPosition = 0;
  private selectedPower = 0;
  private lastSwingInputAt = -1000;
  private ballPosition: WorldPosition = { x: 0, y: 0 };
  private currentLie: Lie = 'tee';
  private qaScenario?: ResolvedQaScenario;
  private replaySession: ReplaySession = createReplaySession(this.profile);

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
  private profileText!: Phaser.GameObjects.Text;
  private cameraText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private meterLabel!: Phaser.GameObjects.Text;
  private meterFiftyLabel!: Phaser.GameObjects.Text;
  private meterSeventyFiveLabel!: Phaser.GameObjects.Text;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private meterGraphics!: Phaser.GameObjects.Graphics;
  private environmentGraphics!: Phaser.GameObjects.Graphics;
  private golferSprite!: Phaser.GameObjects.Image;
  private mapBall!: Phaser.GameObjects.Arc;
  private flightBall!: Phaser.GameObjects.Arc;
  private setupBall!: Phaser.GameObjects.Arc;
  private pauseObjects: Phaser.GameObjects.GameObject[] = [];
  private pauseStatusText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.game);
  }

  create(): void {
    // Phaser reuses a Scene's Clock and TweenManager when the scene is
    // restarted or started again. Always clear a paused state left behind by
    // navigation from the pause menu before scheduling swing events.
    this.restoreSceneMotion();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.restoreSceneMotion();
    });
    this.profile = normalizePlayerProfile(
      this.registry.get(PLAYER_PROFILE_REGISTRY_KEY),
    );
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
    if (this.phase === 'paused') return;
    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.restartScene();
      return;
    }

    if (this.phase === 'setup') {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.changeAim(-3);
      if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.changeAim(3);
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.changeClub(1);
      if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.changeClub(-1);
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
    this.qaScenario = resolveQaScenario(
      this.registry.get(QA_SCENARIO_REGISTRY_KEY),
      this.profile,
    );
    this.aimDegrees = this.qaScenario?.aimDegrees ?? 0;
    this.clubIndex = this.qaScenario?.clubIndex ?? 0;
    this.strokeCount = 0;
    this.meterPosition = 0;
    this.selectedPower = 0;
    this.lastSwingInputAt = -1000;
    this.ballPosition = this.qaScenario
      ? { ...this.qaScenario.position }
      : teePositionForChoice(this.profile.tee);
    this.currentLie = this.qaScenario?.lie ?? 'tee';
    this.replaySession = createReplaySession(this.profile, this.qaScenario?.id);
    saveReplay(this.replaySession);
    this.pauseObjects = [];
    this.pauseStatusText = undefined;
  }

  private drawStaticInterface(): void {
    const frame = this.add.graphics();
    frame.fillStyle(COLORS.tobacco, 1);
    frame.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    frame.fillStyle(COLORS.espresso, 1);
    frame.fillRect(0, 0, GAME_WIDTH, 40);
    frame.fillRect(0, 354, GAME_WIDTH, 86);
    drawCourseMapBase(this, { x: 8, y: 43, width: 336, height: 151 });
    drawLandscapeFrame(this).setDepth(4);

    this.add.text(8, 6, `H${PROTOTYPE_HOLE.number}`, this.headerStyle('#f3e6c8', 10)).setDepth(7);
    this.add.text(35, 6, `PAR ${PROTOTYPE_HOLE.par}`, this.headerStyle('#d8a43e', 9)).setDepth(7);
    this.add
      .text(
        242,
        6,
        `WIND ${PROTOTYPE_HOLE.wind.direction} ${PROTOTYPE_HOLE.wind.speed}`,
        this.headerStyle('#c8b899', 8, false),
      )
      .setDepth(7);
  }

  private headerStyle(
    color: string,
    fontSize: number,
    bold = true,
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: FONT_FAMILY,
      fontSize: `${fontSize}px`,
      fontStyle: bold ? 'bold' : 'normal',
      color,
    };
  }

  private createDynamicInterface(): void {
    this.statusText = this.add
      .text(84, 6, 'SHOT 1', this.headerStyle('#f3e6c8', 9))
      .setDepth(7);
    this.distanceText = this.add
      .text(143, 6, '', this.headerStyle('#f3e6c8', 8))
      .setDepth(7);
    this.lieText = this.add
      .text(8, 23, '', {
        ...this.headerStyle('#24150f', 9),
        backgroundColor: '#f3e6c8',
        padding: { x: 4, y: 2 },
      })
      .setDepth(7);
    this.profileText = this.add
      .text(132, 25, '', this.headerStyle('#c8b899', 7))
      .setDepth(7);

    this.environmentGraphics = this.add.graphics().setDepth(2);
    this.aimGraphics = this.add.graphics().setDepth(5);
    this.meterGraphics = this.add.graphics().setDepth(5);

    const startOnMap = worldToMap(this.ballPosition);
    this.mapBall = this.add
      .circle(startOnMap.x, startOnMap.y, 4, COLORS.white)
      .setStrokeStyle(1, COLORS.espresso)
      .setDepth(6);
    this.flightBall = this.add
      .circle(this.ballScreenX(), GROUND_Y, 3, COLORS.white)
      .setStrokeStyle(1, COLORS.espresso)
      .setDepth(8)
      .setVisible(false);
    this.setupBall = this.add
      .circle(this.ballScreenX(), GROUND_Y, 3, COLORS.white)
      .setStrokeStyle(1, COLORS.espresso)
      .setDepth(8);
    this.golferSprite = this.add
      .image(this.golferScreenX(), 348, golferAsset(this.profile.gender, 'address'))
      .setOrigin(0.5, 1)
      .setDisplaySize(96, 137)
      .setDepth(6);

    this.clubText = this.add
      .text(176, 211, '', {
        ...this.headerStyle('#24150f', 9),
        backgroundColor: '#f3e6c8',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.aimText = this.add
      .text(176, 231, '', {
        ...this.headerStyle('#f3e6c8', 8),
        backgroundColor: '#24150f',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.cameraText = this.add
      .text(176, 248, '', {
        ...this.headerStyle('#f3e6c8', 7),
        backgroundColor: '#5b3929',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.instructionText = this.add
      .text(176, 345, '', {
        ...this.headerStyle('#24150f', 7),
        backgroundColor: '#f3e6c8',
        padding: { x: 4, y: 2 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setWordWrapWidth(320)
      .setDepth(9);
    this.meterLabel = this.add
      .text(this.meterCentreX(), 218, '', {
        ...this.headerStyle('#24150f', 8),
        backgroundColor: '#f3e6c8',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.meterFiftyLabel = this.createMeterTickLabel('50');
    this.meterSeventyFiveLabel = this.createMeterTickLabel('75');
  }

  private createMeterTickLabel(label: string): Phaser.GameObjects.Text {
    return this.add
      .text(0, 0, label, {
        ...this.headerStyle('#c8b899', 7),
        backgroundColor: '#24150f',
        padding: { x: 2, y: 1 },
      })
      .setOrigin(0.5)
      .setDepth(8);
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
    createButton(this, 321, 398, 60, 52, 'RESET', () => this.restartScene(), {
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
      depth: 10,
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
    if (this.phase !== 'setup') return;
    const aimStep = this.currentLie === 'green' ? delta / 3 : delta;
    const aimLimit = this.currentLie === 'green' ? 8 : 30;
    this.aimDegrees = Phaser.Math.Clamp(
      this.aimDegrees + aimStep,
      -aimLimit,
      aimLimit,
    );
    this.refreshSetupDisplay();
  }

  private changeClub(delta: number): void {
    if (this.phase !== 'setup') return;
    this.clubIndex = nextAllowedClubIndex(this.clubIndex, delta, this.currentLie);
    this.refreshSetupDisplay();
  }

  private refreshSetupDisplay(): void {
    if (!allowedClubIndices(this.currentLie).includes(this.clubIndex)) {
      this.clubIndex = this.sensibleClubIndex();
    }

    const club = this.currentClub();
    const mapPosition = worldToMap(this.ballPosition);
    this.mapBall.setPosition(mapPosition.x, mapPosition.y);
    this.clubText.setText(
      club.isPutter
        ? `${club.shortName} · ${club.maxDistanceMetres} M`
        : `${club.shortName} · ${club.maxDistanceMetres} M · ${club.loftDegrees}°`,
    );
    this.aimText.setText(
      `${this.currentLie === 'green' ? 'PUTT LINE' : 'SHOT LINE'} ${
        this.aimDegrees > 0 ? '+' : ''
      }${Math.round(this.aimDegrees)}°`,
    );
    this.lieText.setText(`LIE · ${lieLabel(this.currentLie)}`);
    this.profileText.setText(
      `${this.profile.gender === 'female' ? 'F' : 'M'} · ${
        this.profile.handedness === 'left' ? 'LEFT' : 'RIGHT'
      } · ${this.profile.tee === 'forward' ? 'FWD' : 'BACK'}${
        this.qaScenario ? ' · QA' : ''
      }`,
    );
    this.statusText.setText(`SHOT ${this.strokeCount + 1}`);
    this.distanceText.setText(this.distanceLabel(this.ballPosition));
    const distance = distanceToPin(this.ballPosition);
    const targetPuttPower = putterPowerForDistance(
      this.currentClubAt(3),
      distance,
      'green',
    );
    this.cameraText.setText(
      this.currentLie === 'green'
        ? `CUP ${distance.toFixed(1)} M · SUGGESTED POWER ${Math.round(
            targetPuttPower * 100,
          )}%`
        : `${courseViewStage(this.ballPosition, this.currentLie).toUpperCase()} VIEW · ${
            Math.round(this.ballPosition.y)
          } M UP HOLE`,
    );
    this.instructionText.setText(
      this.qaScenario && this.strokeCount === 0
        ? `QA · ${this.qaScenario.instruction}`
        : this.currentLie === 'green'
          ? 'FACE THE CUP · READ LINE · PRESS SWING'
          : 'AIM · PICK CLUB · PRESS SWING',
    );
    this.meterLabel.setText(
      this.currentLie === 'green'
        ? `TRY ${Math.round(targetPuttPower * 100)}%`
        : 'READY',
    );
    this.meterPosition = 0;
    this.selectedPower = 0;
    this.setupBall.setPosition(this.ballScreenX(), GROUND_Y).setVisible(true);
    this.flightBall.setVisible(false);
    this.golferSprite.setAlpha(1).setVisible(true);
    this.setGolferPose(this.currentLie === 'green' ? 'putt-address' : 'address');
    this.drawPlayingEnvironment(
      this.ballPosition,
      this.currentLie === 'green' ? this.bearingToPin() : this.shotAimDegrees(),
      this.currentLie,
      this.currentLie === 'green',
    );
    this.drawAimGuide();
    this.drawMeter();
  }

  private sensibleClubIndex(): number {
    return recommendedClubIndex(
      distanceToPin(this.ballPosition),
      this.currentLie,
      CLUBS.map((_, index) => this.currentClubAt(index)),
    );
  }

  private currentClub(): ClubDefinition {
    return this.currentClubAt(this.clubIndex);
  }

  private currentClubAt(index: number): ClubDefinition {
    return clubForProfile(CLUBS[index], this.profile);
  }

  private drawAimGuide(): void {
    const club = this.currentClub();
    const projection = calculateShot({
      start: this.ballPosition,
      club,
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

    if (club.isPutter) {
      const pin = worldToMap(PIN_POSITION);
      this.aimGraphics.lineStyle(4, COLORS.espresso, 0.52);
      this.aimGraphics.lineBetween(start.x, start.y, final.x, final.y);
      this.aimGraphics.lineStyle(2, COLORS.cream, 0.96);
      this.aimGraphics.lineBetween(start.x, start.y, final.x, final.y);
      this.aimGraphics.lineStyle(1, COLORS.orange, 1);
      this.aimGraphics.strokeCircle(final.x, final.y, 6);
      this.aimGraphics.lineStyle(2, COLORS.white, 1);
      this.aimGraphics.strokeCircle(pin.x, pin.y, 4);
      return;
    }

    this.aimGraphics.lineStyle(4, COLORS.espresso, 0.42);
    this.aimGraphics.lineBetween(start.x, start.y, landing.x, landing.y);
    this.aimGraphics.lineStyle(2, COLORS.cream, 0.88);
    this.aimGraphics.lineBetween(start.x, start.y, landing.x, landing.y);
    this.aimGraphics.lineStyle(1, COLORS.orange, 0.92);
    this.aimGraphics.lineBetween(landing.x, landing.y, final.x, final.y);
    this.aimGraphics.strokeCircle(landing.x, landing.y, 8);
    this.aimGraphics.lineBetween(landing.x - 4, landing.y, landing.x + 4, landing.y);
    this.aimGraphics.lineBetween(landing.x, landing.y - 4, landing.x, landing.y + 4);
  }

  private drawPlayingEnvironment(
    cameraPosition: WorldPosition,
    bearingDegrees: number,
    cameraLie: Lie,
    showPuttingLine: boolean,
  ): void {
    drawCoursePerspective(this.environmentGraphics, {
      camera: { position: cameraPosition, bearingDegrees },
      currentLie: cameraLie,
    });

    if (!showPuttingLine) return;
    const left = 9;
    const width = 334;
    this.environmentGraphics.fillStyle(COLORS.green, 0.88);
    this.environmentGraphics.fillRect(left, 286, width, 65);
    this.environmentGraphics.fillStyle(COLORS.fairwayLight, 0.2);
    for (let x = left; x < left + width; x += 34) {
      this.environmentGraphics.fillRect(x, 286, 17, 65);
    }
    this.drawPuttingLineAndCup();
  }

  private drawPuttingLineAndCup(): void {
    const ball = { x: this.ballScreenX(), y: GROUND_Y };
    const cup = { x: this.cupScreenX(), y: this.cupScreenY() };
    const aimTarget = puttingAimTargetScreenPosition(ball, cup, this.aimDegrees);
    this.environmentGraphics.lineStyle(5, COLORS.espresso, 0.32);
    this.environmentGraphics.lineBetween(ball.x, ball.y, aimTarget.x, aimTarget.y);
    this.environmentGraphics.lineStyle(2, COLORS.cream, 0.94);
    this.environmentGraphics.lineBetween(ball.x, ball.y, aimTarget.x, aimTarget.y);
    if (Math.abs(this.aimDegrees) > 0.01) {
      this.environmentGraphics.fillStyle(COLORS.orange, 1);
      this.environmentGraphics.fillCircle(aimTarget.x, aimTarget.y, 3);
    }
    this.environmentGraphics.fillStyle(COLORS.black, 1);
    this.environmentGraphics.fillEllipse(cup.x, cup.y, 13, 5);
    this.environmentGraphics.lineStyle(2, COLORS.cream, 1);
    this.environmentGraphics.lineBetween(cup.x, cup.y, cup.x, cup.y - 42);
    this.environmentGraphics.fillStyle(COLORS.orange, 1);
    const flagDirection = this.profile.handedness === 'right' ? -1 : 1;
    this.environmentGraphics.fillTriangle(
      cup.x,
      cup.y - 42,
      cup.x + flagDirection * 25,
      cup.y - 33,
      cup.x,
      cup.y - 25,
    );
  }

  private drawMeter(): void {
    const centreX = this.meterCentreX();
    const centreY = 294;
    const contactAngle = Math.PI / 2;
    const maximumAngle = Math.PI * 1.5;
    const markerAngle = meterAngleForPosition(this.meterPosition);

    const arc = (startAngle: number, endAngle: number, color: number): void => {
      this.meterGraphics.lineStyle(9, color, 1);
      this.meterGraphics.beginPath();
      this.meterGraphics.arc(centreX, centreY, METER_RADIUS, startAngle, endAngle, false);
      this.meterGraphics.strokePath();
    };
    const radial = (
      angle: number,
      innerRadius: number,
      outerRadius: number,
      width: number,
      color: number,
      alpha = 1,
    ): void => {
      this.meterGraphics.lineStyle(width, color, alpha);
      this.meterGraphics.lineBetween(
        centreX + Math.cos(angle) * innerRadius,
        centreY + Math.sin(angle) * innerRadius,
        centreX + Math.cos(angle) * outerRadius,
        centreY + Math.sin(angle) * outerRadius,
      );
    };

    this.meterGraphics.clear();
    this.meterGraphics.fillStyle(COLORS.espresso, 0.68);
    this.meterGraphics.fillCircle(centreX, centreY, 33);
    this.meterGraphics.lineStyle(17, COLORS.espresso, 0.92);
    this.meterGraphics.beginPath();
    this.meterGraphics.arc(centreX, centreY, METER_RADIUS, 0, maximumAngle, false);
    this.meterGraphics.strokePath();
    this.meterGraphics.lineStyle(13, COLORS.creamMuted, 0.44);
    this.meterGraphics.beginPath();
    this.meterGraphics.arc(centreX, centreY, METER_RADIUS, 0, maximumAngle, false);
    this.meterGraphics.strokePath();
    arc(0, contactAngle, COLORS.fairwayLight);
    arc(contactAngle, Math.PI, COLORS.green);
    arc(Math.PI, Math.PI * 1.25, COLORS.marigold);
    arc(Math.PI * 1.25, Math.PI * 1.4, COLORS.orange);
    arc(Math.PI * 1.4, maximumAngle, COLORS.red);

    const fiftyAngle = meterAngleForPosition(0.5);
    const seventyFiveAngle = meterAngleForPosition(0.75);
    radial(fiftyAngle, METER_RADIUS - 7, METER_RADIUS + 7, 3, COLORS.creamMuted);
    radial(seventyFiveAngle, METER_RADIUS - 7, METER_RADIUS + 7, 3, COLORS.creamMuted);
    if (this.currentLie === 'green') {
      radial(
        meterAngleForPosition(this.suggestedPuttPower()),
        METER_RADIUS - 10,
        METER_RADIUS + 10,
        3,
        COLORS.white,
        0.68,
      );
    }
    if (this.phase === 'accuracy') {
      radial(
        meterAngleForPosition(this.selectedPower),
        METER_RADIUS - 7,
        METER_RADIUS + 8,
        3,
        COLORS.orange,
      );
    }
    if (this.phase === 'power' || this.phase === 'accuracy') {
      radial(markerAngle, METER_RADIUS - 12, METER_RADIUS + 11, 7, COLORS.espresso);
      radial(markerAngle, METER_RADIUS - 10, METER_RADIUS + 9, 3, COLORS.white);
      this.meterGraphics.fillStyle(COLORS.white, 1);
      this.meterGraphics.fillCircle(
        centreX + Math.cos(markerAngle) * (METER_RADIUS + 10),
        centreY + Math.sin(markerAngle) * (METER_RADIUS + 10),
        3,
      );
    }
    radial(contactAngle, METER_RADIUS - 14, METER_RADIUS + 13, 7, COLORS.espresso);
    radial(contactAngle, METER_RADIUS - 12, METER_RADIUS + 11, 4, COLORS.white);
    this.meterGraphics.fillStyle(COLORS.espresso, 1);
    this.meterGraphics.fillCircle(centreX, centreY, 4);
    this.positionMeterTickLabel(this.meterFiftyLabel, fiftyAngle, 65);
    this.positionMeterTickLabel(this.meterSeventyFiveLabel, seventyFiveAngle, 65);
    this.meterLabel.setPosition(centreX, 218);

    if (this.phase === 'power') {
      this.meterLabel.setText(`POWER ${Math.round(this.meterPosition * 100)}%`);
    } else if (this.phase === 'accuracy') {
      this.meterLabel.setText(`${Math.round(this.selectedPower * 100)}% · CONTACT`);
    }
  }

  private positionMeterTickLabel(
    label: Phaser.GameObjects.Text,
    angle: number,
    radius: number,
  ): void {
    label.setPosition(
      this.meterCentreX() + Math.cos(angle) * radius,
      294 + Math.sin(angle) * radius,
    );
  }

  private handleSwingInput(): void {
    if (this.phase === 'paused' || this.phase === 'result') return;
    const now = this.time.now;
    if (now - this.lastSwingInputAt < 160) return;
    this.lastSwingInputAt = now;

    if (this.phase === 'setup') {
      this.phase = 'power';
      this.meterPosition = 0;
      this.selectedPower = 0;
      this.instructionText.setText('PRESS SWING ONCE TO LOCK POWER');
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
    if (this.phase !== 'accuracy') return;
    const input = {
      start: this.ballPosition,
      club: this.currentClub(),
      power: this.selectedPower,
      accuracyError,
      aimDegrees: this.shotAimDegrees(),
      wind: PROTOTYPE_HOLE.wind,
      startingLie: this.currentLie,
    };
    const result = calculateShot(input);
    this.replaySession = appendReplayShot(this.replaySession, input, result);
    saveReplay(this.replaySession);
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
    this.setupBall.setVisible(false);
    this.playGolferSwing(result);
  }

  private playGolferSwing(result: ShotResult): void {
    if (result.club.isPutter) {
      this.setGolferPose('putt-address');
      this.time.delayedCall(220, () => this.setGolferPose('putt-stroke'));
      this.time.delayedCall(430, () => this.launchCalculatedShot(result));
      return;
    }
    this.setGolferPose('backswing');
    this.time.delayedCall(300, () => this.setGolferPose('top'));
    this.time.delayedCall(640, () => this.setGolferPose('downswing'));
    this.time.delayedCall(930, () => {
      this.setGolferPose('impact');
      this.launchCalculatedShot(result);
    });
    this.time.delayedCall(1130, () => this.setGolferPose('follow-through'));
  }

  private launchCalculatedShot(result: ShotResult): void {
    const screenEnd = this.puttingResultScreenPosition(result);
    const startX = this.ballScreenX();
    this.flightBall.setPosition(startX, GROUND_Y).setVisible(true);
    const animation = { progress: 0 };
    this.tweens.add({
      targets: animation,
      progress: 1,
      duration: result.animationDurationMs,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const sample = sampleTrajectory(result, animation.progress);
        const mapPosition = worldToMap(sample);
        const screenPosition = result.club.isPutter
          ? {
              x: Phaser.Math.Linear(startX, screenEnd.x, animation.progress),
              y: Phaser.Math.Linear(GROUND_Y, screenEnd.y, animation.progress),
            }
          : shotBallScreenPosition(
              result,
              sample,
              animation.progress,
              this.profile.handedness,
            );
        this.mapBall.setPosition(mapPosition.x, mapPosition.y);
        this.flightBall.setPosition(screenPosition.x, screenPosition.y);
        if (!result.club.isPutter) {
          const camera = shotCameraForSample(result, sample, animation.progress);
          this.drawPlayingEnvironment(
            camera.position,
            camera.bearingDegrees,
            getLieAt(camera.position),
            false,
          );
          const golferFade = Phaser.Math.Clamp(
            (animation.progress - 0.18) / 0.28,
            0,
            1,
          );
          this.golferSprite.setAlpha(1 - golferFade);
        }
        this.meterLabel.setText(sample.phase.toUpperCase());
      },
      onComplete: () => {
        if (!result.club.isPutter) {
          const finalScreen = shotBallScreenPosition(
            result,
            sampleTrajectory(result, 1),
            1,
            this.profile.handedness,
          );
          this.flightBall.setPosition(finalScreen.x, finalScreen.y).setVisible(true);
          this.golferSprite.setAlpha(1).setVisible(false);
        }
        this.resolveCalculatedShot(result);
      },
    });
  }

  private puttingResultScreenPosition(result: ShotResult): WorldPosition {
    if (result.holed) return { x: this.cupScreenX(), y: this.cupScreenY() };
    const distanceFromCup = distanceToPin(result.start);
    const distanceRatio = distanceFromCup > 0 ? result.totalMetres / distanceFromCup : 1;
    const relativeAim = this.normalizedDegrees(
      result.launchDirectionDegrees - this.bearingToPinFrom(result.start),
    );
    return puttingRollScreenPosition(
      { x: this.ballScreenX(), y: GROUND_Y },
      { x: this.cupScreenX(), y: this.cupScreenY() },
      distanceRatio,
      relativeAim,
    );
  }

  private resolveCalculatedShot(result: ShotResult): void {
    this.ballPosition = { ...result.resolvedEnd };
    this.currentLie = result.resolvedLie;
    if (result.penalty) this.flightBall.setVisible(false);
    const resolvedMapPosition = worldToMap(this.ballPosition);
    this.mapBall.setPosition(resolvedMapPosition.x, resolvedMapPosition.y);
    this.distanceText.setText(
      result.holed ? 'IN THE CUP' : this.distanceLabel(this.ballPosition),
    );

    if (result.holed) {
      this.currentLie = 'green';
      this.instructionText.setText('IN THE CUP!');
      this.meterLabel.setText('HOLED');
      this.aimGraphics.clear();
      if (this.strokeCount < PROTOTYPE_HOLE.par) this.setGolferPose('celebrate');
      this.time.delayedCall(1250, () => {
        this.scene.start(SCENES.result, { strokes: this.strokeCount });
      });
      return;
    }

    if (result.penaltyType === 'water') {
      this.instructionText.setText(
        `WATER · +1 PENALTY · DROP AT ENTRY · ${lieLabel(this.currentLie)}`,
      );
    } else if (result.penaltyType === 'outOfBounds') {
      this.instructionText.setText('OUT OF BOUNDS · +1 PENALTY · PREVIOUS SPOT');
    } else {
      this.instructionText.setText(
        `${Math.round(result.carryMetres)} CARRY + ${Math.round(
          result.rolloutMetres,
        )} ROLL · ${lieLabel(this.currentLie)}`,
      );
    }

    this.lieText.setText(`LIE · ${lieLabel(this.currentLie)}`);
    this.cameraText.setText(
      `BALL LANDED · ${lieLabel(this.currentLie)} · ${this.distanceLabel(
        this.ballPosition,
      )}`,
    );
    this.drawPlayingEnvironment(
      this.ballPosition,
      this.bearingToPin(),
      this.currentLie,
      false,
    );
    if (!result.penalty) {
      this.flightBall
        .setPosition(COURSE_VIEW_CENTRE_X, GROUND_Y)
        .setVisible(true);
    }
    this.aimDegrees = this.currentLie === 'green' ? 0 : this.directAimToPin();
    this.time.delayedCall(1700, () => {
      this.phase = 'setup';
      this.refreshSetupDisplay();
    });
  }

  private directAimToPin(): number {
    return Phaser.Math.Clamp(this.bearingToPin(), -30, 30);
  }

  private bearingToPin(): number {
    return this.bearingToPinFrom(this.ballPosition);
  }

  private bearingToPinFrom(position: WorldPosition): number {
    return (
      (Math.atan2(PIN_POSITION.x - position.x, PIN_POSITION.y - position.y) * 180) /
      Math.PI
    );
  }

  private shotAimDegrees(): number {
    return this.currentLie === 'green'
      ? this.bearingToPin() + this.aimDegrees
      : this.aimDegrees;
  }

  private normalizedDegrees(value: number): number {
    let normalized = value;
    while (normalized > 180) normalized -= 360;
    while (normalized < -180) normalized += 360;
    return normalized;
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

  private setGolferPose(pose: GolferPose): void {
    this.golferSprite
      .setTexture(golferAsset(this.profile.gender, pose))
      .setPosition(this.golferScreenX(), 348)
      .setDisplaySize(96, 137)
      .setFlipX(this.profile.handedness === 'left')
      .setVisible(true);
  }

  private golferScreenX(): number {
    return this.profile.handedness === 'right' ? 84 : 268;
  }

  private ballScreenX(): number {
    return ballAddressScreenX(this.profile.handedness);
  }

  private cupScreenX(): number {
    return this.profile.handedness === 'right' ? 329 : 23;
  }

  private cupScreenY(): number {
    return GROUND_Y;
  }

  private suggestedPuttPower(): number {
    return putterPowerForDistance(
      this.currentClubAt(3),
      distanceToPin(this.ballPosition),
      'green',
    );
  }

  private meterCentreX(): number {
    return this.profile.handedness === 'right' ? 260 : 92;
  }

  private togglePause(): void {
    if (this.phase === 'paused') {
      this.resumeGame();
      return;
    }
    this.phaseBeforePause = this.phase;
    this.phase = 'paused';
    this.time.paused = true;
    this.tweens.pauseAll();
    const blocker = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        COLORS.black,
        0.78,
      )
      .setInteractive()
      .setDepth(100);
    const qaMode = isQaMode();
    const panel = this.add
      .rectangle(
        GAME_WIDTH / 2,
        220,
        270,
        qaMode ? 346 : 252,
        COLORS.espresso,
        1,
      )
      .setStrokeStyle(3, COLORS.cream)
      .setDepth(101);
    const title = this.add
      .text(GAME_WIDTH / 2, qaMode ? 76 : 129, 'PAUSED', {
        ...this.headerStyle('#f3e6c8', 24),
      })
      .setOrigin(0.5)
      .setDepth(102);
    this.pauseStatusText = qaMode
      ? this.add
          .text(GAME_WIDTH / 2, 103, 'QA TOOLS ENABLED', {
            ...this.headerStyle('#d8a43e', 8),
          })
          .setOrigin(0.5)
          .setDepth(102)
      : undefined;
    const resume = createButton(
      this,
      GAME_WIDTH / 2,
      qaMode ? 140 : 188,
      176,
      qaMode ? 38 : 46,
      'RESUME',
      () => this.resumeGame(),
      { depth: 102 },
    );
    const restart = createButton(
      this,
      GAME_WIDTH / 2,
      qaMode ? 188 : 247,
      176,
      qaMode ? 38 : 46,
      'RESTART HOLE',
      () => this.restartScene(),
      {
        fillColor: COLORS.marigold,
        hoverColor: COLORS.cream,
        depth: 102,
        fontSize: '12px',
      },
    );
    const qaObjects: Phaser.GameObjects.GameObject[] = [];
    if (qaMode) {
      qaObjects.push(
        createButton(
          this,
          GAME_WIDTH / 2,
          236,
          176,
          38,
          'COPY REPLAY',
          () => this.copyReplay(),
          {
            fillColor: COLORS.brownLight,
            hoverColor: COLORS.marigold,
            textColor: '#f3e6c8',
            depth: 102,
            fontSize: '11px',
          },
        ),
        createButton(
          this,
          GAME_WIDTH / 2,
          284,
          176,
          38,
          'QA SCENARIOS',
          () => this.startScene(SCENES.qa),
          {
            fillColor: COLORS.marigold,
            hoverColor: COLORS.cream,
            depth: 102,
            fontSize: '11px',
          },
        ),
      );
    }
    const exit = createButton(
      this,
      GAME_WIDTH / 2,
      qaMode ? 332 : 306,
      176,
      qaMode ? 38 : 46,
      'EXIT TO TITLE',
      () => this.startScene(SCENES.title),
      {
        fillColor: COLORS.brownLight,
        hoverColor: COLORS.red,
        textColor: '#f3e6c8',
        depth: 102,
        fontSize: '12px',
      },
    );
    this.pauseObjects = [
      blocker,
      panel,
      title,
      ...(this.pauseStatusText ? [this.pauseStatusText] : []),
      resume,
      restart,
      ...qaObjects,
      exit,
    ];
  }

  private copyReplay(): void {
    const serialized = serializeReplay(this.replaySession);
    if (!navigator.clipboard) {
      this.pauseStatusText?.setText('CLIPBOARD BLOCKED · REPLAY SAVED LOCALLY');
      return;
    }
    void navigator.clipboard.writeText(serialized).then(
      () => this.pauseStatusText?.setText(`COPIED ${this.replaySession.shots.length} SHOT(S)`),
      () => this.pauseStatusText?.setText('CLIPBOARD BLOCKED · REPLAY SAVED LOCALLY'),
    );
  }

  private resumeGame(): void {
    for (const object of this.pauseObjects) object.destroy();
    this.pauseObjects = [];
    this.pauseStatusText = undefined;
    this.phase = this.phaseBeforePause;
    this.restoreSceneMotion();
  }

  private restartScene(): void {
    this.restoreSceneMotion();
    this.scene.restart();
  }

  private startScene(sceneKey: string): void {
    this.restoreSceneMotion();
    this.scene.start(sceneKey);
  }

  private restoreSceneMotion(): void {
    resumeSceneSystems(this.time, this.tweens);
  }
}
