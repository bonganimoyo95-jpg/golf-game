import Phaser from 'phaser';
import { golferAsset, type GolferPose } from '../assets';
import { drawCourseMapBase, drawLandscape } from '../courseArt';
import {
  PIN_POSITION,
  distanceToPin,
  lieLabel,
  teePositionForGender,
  worldToMap,
  type WorldPosition,
} from '../courseModel';
import { CLUBS, PROTOTYPE_HOLE, type ClubDefinition, type Lie } from '../data';
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

const GROUND_Y = 329;
const PUTTING_METER_SPEED_MULTIPLIER = 0.55;
const METER_RADIUS = 47;

export class GameScene extends Phaser.Scene {
  private profile: PlayerProfile = { gender: 'male', handedness: 'right' };
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

  constructor() {
    super(SCENES.game);
  }

  create(): void {
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
      this.scene.restart();
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
    this.aimDegrees = 0;
    this.clubIndex = 0;
    this.strokeCount = 0;
    this.meterPosition = 0;
    this.selectedPower = 0;
    this.lastSwingInputAt = -1000;
    this.ballPosition = teePositionForGender(this.profile.gender);
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
    this.aimDegrees = Phaser.Math.Clamp(this.aimDegrees + aimStep, -30, 30);
    this.refreshSetupDisplay();
  }

  private changeClub(delta: number): void {
    if (this.phase !== 'setup') return;
    const allowedIndices =
      this.currentLie === 'green'
        ? [3]
        : this.currentLie === 'bunker'
          ? [1, 2]
          : [0, 1, 2];
    const currentAllowedPosition = Math.max(0, allowedIndices.indexOf(this.clubIndex));
    this.clubIndex = allowedIndices[
      Phaser.Math.Wrap(currentAllowedPosition + delta, 0, allowedIndices.length)
    ];
    this.refreshSetupDisplay();
  }

  private refreshSetupDisplay(): void {
    if (this.currentLie === 'green') {
      this.clubIndex = 3;
    } else if (
      CLUBS[this.clubIndex].isPutter ||
      (this.currentLie === 'bunker' && this.clubIndex === 0)
    ) {
      this.clubIndex = this.currentLie === 'bunker' ? 2 : this.sensibleClubIndex();
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
      }-HANDED`,
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
        ? `CUP ${distance.toFixed(1)} M · TARGET ${Math.round(targetPuttPower * 100)}%`
        : `FROM ${lieLabel(this.currentLie)} · ${Math.round(distance)} M TO PIN`,
    );
    this.instructionText.setText(
      this.currentLie === 'green'
        ? 'FACE THE CUP · READ LINE · PRESS SWING'
        : 'AIM · PICK CLUB · PRESS SWING',
    );
    this.meterLabel.setText('READY');
    this.meterPosition = 0;
    this.selectedPower = 0;
    this.setupBall.setPosition(this.ballScreenX(), GROUND_Y).setVisible(true);
    this.flightBall.setVisible(false);
    this.setGolferPose(this.currentLie === 'green' ? 'putt-address' : 'address');
    this.drawPlayingEnvironment();
    this.drawAimGuide();
    this.drawMeter();
  }

  private sensibleClubIndex(): number {
    const distance = distanceToPin(this.ballPosition);
    if (distance <= this.currentClubAt(2).maxDistanceMetres * 0.92) return 2;
    if (distance <= this.currentClubAt(1).maxDistanceMetres * 1.05) return 1;
    return 0;
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

  private drawPlayingEnvironment(): void {
    this.environmentGraphics.clear();
    const left = 9;
    const width = 334;

    if (this.currentLie === 'green') {
      this.environmentGraphics.fillStyle(COLORS.green, 0.84);
      this.environmentGraphics.fillRect(left, 286, width, 65);
      this.environmentGraphics.fillStyle(COLORS.fairwayLight, 0.22);
      for (let x = left; x < left + width; x += 34) {
        this.environmentGraphics.fillRect(x, 286, 17, 65);
      }
      this.drawPuttingLineAndCup();
      return;
    }

    if (this.currentLie === 'bunker') {
      this.environmentGraphics.fillStyle(COLORS.bunker, 0.94);
      this.environmentGraphics.fillEllipse(this.golferScreenX(), 334, 150, 38);
      this.environmentGraphics.lineStyle(2, COLORS.cream, 0.52);
      this.environmentGraphics.strokeEllipse(this.golferScreenX(), 334, 150, 38);
      return;
    }

    if (this.currentLie === 'rough') {
      this.environmentGraphics.fillStyle(COLORS.rough, 0.66);
      this.environmentGraphics.fillRect(left, 319, width, 32);
      this.environmentGraphics.lineStyle(1, COLORS.fairwayLight, 0.68);
      for (let x = left + 5; x < left + width; x += 12) {
        this.environmentGraphics.lineBetween(x, 339, x + 4, 325);
      }
      return;
    }

    this.environmentGraphics.fillStyle(COLORS.fairway, 0.38);
    this.environmentGraphics.fillRect(left, 319, width, 32);
    this.environmentGraphics.fillStyle(COLORS.fairwayLight, 0.14);
    for (let x = left; x < left + width; x += 42) {
      this.environmentGraphics.fillRect(x, 319, 21, 32);
    }
  }

  private drawPuttingLineAndCup(): void {
    const ballX = this.ballScreenX();
    const cupX = this.cupScreenX();
    const aimEndY = GROUND_Y + this.aimDegrees * 0.7;
    this.environmentGraphics.lineStyle(5, COLORS.espresso, 0.32);
    this.environmentGraphics.lineBetween(ballX, GROUND_Y, cupX, aimEndY);
    this.environmentGraphics.lineStyle(2, COLORS.cream, 0.94);
    this.environmentGraphics.lineBetween(ballX, GROUND_Y, cupX, aimEndY);
    this.environmentGraphics.fillStyle(COLORS.black, 1);
    this.environmentGraphics.fillEllipse(cupX, GROUND_Y, 13, 5);
    this.environmentGraphics.lineStyle(2, COLORS.cream, 1);
    this.environmentGraphics.lineBetween(cupX, GROUND_Y, cupX, 287);
    this.environmentGraphics.fillStyle(COLORS.orange, 1);
    const flagDirection = this.profile.handedness === 'right' ? -1 : 1;
    this.environmentGraphics.fillTriangle(
      cupX,
      287,
      cupX + flagDirection * 25,
      296,
      cupX,
      304,
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
    const result = calculateShot({
      start: this.ballPosition,
      club: this.currentClub(),
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
    this.time.delayedCall(220, () => this.setGolferPose('top'));
    this.time.delayedCall(470, () => this.setGolferPose('downswing'));
    this.time.delayedCall(700, () => {
      this.setGolferPose('impact');
      this.launchCalculatedShot(result);
    });
    this.time.delayedCall(880, () => this.setGolferPose('follow-through'));
  }

  private launchCalculatedShot(result: ShotResult): void {
    const screenEnd = result.club.isPutter
      ? this.puttingResultScreenPosition(result)
      : this.fullShotScreenPosition(result);
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
        const sideViewX = Phaser.Math.Linear(startX, screenEnd.x, animation.progress);
        const groundY = Phaser.Math.Linear(GROUND_Y, screenEnd.y, animation.progress);
        this.mapBall.setPosition(mapPosition.x, mapPosition.y);
        this.flightBall.setPosition(
          sideViewX,
          groundY - Math.min(88, sample.height * 2.35),
        );
        this.meterLabel.setText(sample.phase.toUpperCase());
      },
      onComplete: () => {
        this.flightBall.setVisible(false);
        this.resolveCalculatedShot(result);
      },
    });
  }

  private fullShotScreenPosition(result: ShotResult): WorldPosition {
    const direction = this.profile.handedness === 'right' ? 1 : -1;
    const relativeDirection = this.normalizedDegrees(
      result.launchDirectionDegrees - this.bearingToPinFrom(result.start),
    );
    return {
      x: direction > 0 ? 339 : 13,
      y: Phaser.Math.Clamp(GROUND_Y + relativeDirection * 0.55, 313, 345),
    };
  }

  private puttingResultScreenPosition(result: ShotResult): WorldPosition {
    if (result.holed) return { x: this.cupScreenX(), y: GROUND_Y };
    const distanceFromCup = distanceToPin(result.start);
    const distanceRatio = distanceFromCup > 0 ? result.totalMetres / distanceFromCup : 1;
    const relativeAim = this.normalizedDegrees(
      result.launchDirectionDegrees - this.bearingToPinFrom(result.start),
    );
    const direction = this.profile.handedness === 'right' ? 1 : -1;
    const availablePixels = Math.abs(this.cupScreenX() - this.ballScreenX());
    return {
      x: Phaser.Math.Clamp(
        this.ballScreenX() +
          direction * availablePixels * Phaser.Math.Clamp(distanceRatio, 0, 1.28),
        11,
        341,
      ),
      y: Phaser.Math.Clamp(GROUND_Y + relativeAim * 0.75, 313, 345),
    };
  }

  private resolveCalculatedShot(result: ShotResult): void {
    this.ballPosition = { ...result.resolvedEnd };
    this.currentLie = result.resolvedLie;
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
    this.drawPlayingEnvironment();
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
    return this.profile.handedness === 'right' ? 132 : 220;
  }

  private cupScreenX(): number {
    return this.profile.handedness === 'right' ? 329 : 23;
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
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, 220, 270, 252, COLORS.espresso, 1)
      .setStrokeStyle(3, COLORS.cream)
      .setDepth(101);
    const title = this.add
      .text(GAME_WIDTH / 2, 129, 'PAUSED', {
        ...this.headerStyle('#f3e6c8', 24),
      })
      .setOrigin(0.5)
      .setDepth(102);
    const resume = createButton(
      this,
      GAME_WIDTH / 2,
      188,
      176,
      46,
      'RESUME',
      () => this.resumeGame(),
      { depth: 102 },
    );
    const restart = createButton(
      this,
      GAME_WIDTH / 2,
      247,
      176,
      46,
      'RESTART HOLE',
      () => this.scene.restart(),
      {
        fillColor: COLORS.marigold,
        hoverColor: COLORS.cream,
        depth: 102,
        fontSize: '12px',
      },
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
    for (const object of this.pauseObjects) object.destroy();
    this.pauseObjects = [];
    this.phase = this.phaseBeforePause;
    this.tweens.resumeAll();
  }
}
