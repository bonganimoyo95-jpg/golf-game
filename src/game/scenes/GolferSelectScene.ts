import Phaser from 'phaser';
import { ASSETS, golferAsset } from '../assets';
import { GAME_WIDTH, SCENES } from '../constants';
import {
  PLAYER_PROFILE_REGISTRY_KEY,
  normalizePlayerProfile,
  profileLabel,
  type GolferGender,
  type Handedness,
  type PlayerProfile,
} from '../playerProfile';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/createButton';

export class GolferSelectScene extends Phaser.Scene {
  private profile: PlayerProfile = { gender: 'male', handedness: 'right' };
  private preview!: Phaser.GameObjects.Image;
  private summary!: Phaser.GameObjects.Text;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENES.golferSelect);
  }

  create(): void {
    this.profile = normalizePlayerProfile(
      this.registry.get(PLAYER_PROFILE_REGISTRY_KEY),
    );
    this.cameras.main.setBackgroundColor(COLORS.espresso);

    this.add
      .image(0, 0, ASSETS.coursePanorama)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, 178)
      .setAlpha(0.56);

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.tobacco, 0.98);
    panel.fillRoundedRect(15, 18, GAME_WIDTH - 30, 404, 12);
    panel.lineStyle(2, COLORS.cream, 0.72);
    panel.strokeRoundedRect(15, 18, GAME_WIDTH - 30, 404, 12);

    this.add
      .text(GAME_WIDTH / 2, 42, 'CHOOSE YOUR GOLFER', {
        fontFamily: FONT_FAMILY,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 68, 'GOLFER · STANCE · TEE', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#d8a43e',
      })
      .setOrigin(0.5);

    this.preview = this.add
      .image(GAME_WIDTH / 2, 242, golferAsset(this.profile.gender, 'idle'))
      .setOrigin(0.5, 1)
      .setDisplaySize(96, 137);

    this.addChoiceButtons();

    this.summary = this.add
      .text(GAME_WIDTH / 2, 354, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f3e6c8',
        backgroundColor: '#24150f',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, 396, 182, 42, 'CONTINUE', () => {
      this.confirmSelection();
    });

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.refreshPreview();
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.confirmSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.scene.start(SCENES.title);
    }
  }

  private addChoiceButtons(): void {
    this.add
      .text(28, 91, 'GOLFER', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#c8b899',
      });

    createButton(this, 92, 119, 126, 38, 'MALE', () => this.setGender('male'), {
      fontSize: '11px',
    });
    createButton(this, 260, 119, 126, 38, 'FEMALE', () => this.setGender('female'), {
      fontSize: '11px',
    });

    this.add
      .text(28, 260, 'STANCE', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#c8b899',
      });

    createButton(
      this,
      92,
      289,
      126,
      38,
      'RIGHT-HANDED',
      () => this.setHandedness('right'),
      { fillColor: COLORS.brownLight, textColor: '#f3e6c8', fontSize: '9px' },
    );
    createButton(
      this,
      260,
      289,
      126,
      38,
      'LEFT-HANDED',
      () => this.setHandedness('left'),
      { fillColor: COLORS.brownLight, textColor: '#f3e6c8', fontSize: '9px' },
    );
  }

  private setGender(gender: GolferGender): void {
    this.profile.gender = gender;
    this.refreshPreview();
  }

  private setHandedness(handedness: Handedness): void {
    this.profile.handedness = handedness;
    this.refreshPreview();
  }

  private refreshPreview(): void {
    this.preview
      .setTexture(golferAsset(this.profile.gender, 'idle'))
      .setFlipX(this.profile.handedness === 'left');
    this.summary?.setText(
      `${profileLabel(this.profile)} · ${
        this.profile.gender === 'female' ? 'FRONT TEES' : 'BACK TEES'
      }`,
    );
  }

  private confirmSelection(): void {
    this.registry.set(PLAYER_PROFILE_REGISTRY_KEY, { ...this.profile });
    this.scene.start(SCENES.holeIntro);
  }
}
