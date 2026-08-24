import Phaser from 'phaser';
import { ASSETS, golferAsset } from '../assets';
import { GAME_WIDTH, SCENES } from '../constants';
import {
  PLAYER_PROFILE_REGISTRY_KEY,
  normalizePlayerProfile,
  profileLabel,
  teeLabel,
  type GolferGender,
  type Handedness,
  type PlayerProfile,
  type TeeChoice,
} from '../playerProfile';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton, setButtonSelected } from '../ui/createButton';

type ButtonPair<T extends string> = Record<T, Phaser.GameObjects.Container>;

export class GolferSelectScene extends Phaser.Scene {
  private profile: PlayerProfile = {
    gender: 'male',
    handedness: 'right',
    tee: 'back',
  };
  private preview!: Phaser.GameObjects.Image;
  private summary!: Phaser.GameObjects.Text;
  private genderButtons!: ButtonPair<GolferGender>;
  private handednessButtons!: ButtonPair<Handedness>;
  private teeButtons!: ButtonPair<TeeChoice>;
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
    panel.fillRoundedRect(15, 15, GAME_WIDTH - 30, 410, 12);
    panel.lineStyle(2, COLORS.cream, 0.72);
    panel.strokeRoundedRect(15, 15, GAME_WIDTH - 30, 410, 12);

    this.add
      .text(GAME_WIDTH / 2, 38, 'BUILD YOUR GOLFER', {
        fontFamily: FONT_FAMILY,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 62, 'LOOK · STANCE · TEE ARE INDEPENDENT', {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#d8a43e',
      })
      .setOrigin(0.5);

    this.preview = this.add
      .image(GAME_WIDTH / 2, 244, golferAsset(this.profile.gender, 'idle'))
      .setOrigin(0.5, 1)
      .setDisplaySize(82, 117);

    this.addChoiceButtons();

    this.summary = this.add
      .text(GAME_WIDTH / 2, 354, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#f3e6c8',
        backgroundColor: '#24150f',
        padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, 397, 182, 40, 'CONTINUE', () => {
      this.confirmSelection();
    });

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.refreshPreview();
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) this.confirmSelection();
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.scene.start(SCENES.title);
  }

  private label(x: number, y: number, text: string): void {
    this.add.text(x, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#c8b899',
    });
  }

  private addChoiceButtons(): void {
    this.label(28, 78, 'GOLFER');
    this.genderButtons = {
      male: createButton(this, 92, 106, 126, 34, 'MALE', () => this.setGender('male'), {
        fillColor: COLORS.brownLight,
        textColor: '#f3e6c8',
        fontSize: '10px',
      }),
      female: createButton(this, 260, 106, 126, 34, 'FEMALE', () => this.setGender('female'), {
        fillColor: COLORS.brownLight,
        textColor: '#f3e6c8',
        fontSize: '10px',
      }),
    };

    this.label(28, 249, 'STANCE');
    this.handednessButtons = {
      right: createButton(this, 92, 274, 126, 34, 'RIGHT-HANDED', () => this.setHandedness('right'), {
        fillColor: COLORS.brownLight,
        textColor: '#f3e6c8',
        fontSize: '9px',
      }),
      left: createButton(this, 260, 274, 126, 34, 'LEFT-HANDED', () => this.setHandedness('left'), {
        fillColor: COLORS.brownLight,
        textColor: '#f3e6c8',
        fontSize: '9px',
      }),
    };

    this.label(28, 296, 'TEE');
    this.teeButtons = {
      back: createButton(this, 92, 321, 126, 34, 'BACK TEES', () => this.setTee('back'), {
        fillColor: COLORS.brownLight,
        textColor: '#f3e6c8',
        fontSize: '9px',
      }),
      forward: createButton(this, 260, 321, 126, 34, 'FORWARD TEES', () => this.setTee('forward'), {
        fillColor: COLORS.brownLight,
        textColor: '#f3e6c8',
        fontSize: '9px',
      }),
    };
  }

  private setGender(gender: GolferGender): void {
    this.profile.gender = gender;
    this.refreshPreview();
  }

  private setHandedness(handedness: Handedness): void {
    this.profile.handedness = handedness;
    this.refreshPreview();
  }

  private setTee(tee: TeeChoice): void {
    this.profile.tee = tee;
    this.refreshPreview();
  }

  private refreshPreview(): void {
    this.preview
      .setTexture(golferAsset(this.profile.gender, 'idle'))
      .setFlipX(this.profile.handedness === 'left');
    this.summary?.setText(`${profileLabel(this.profile)} · ${teeLabel(this.profile.tee)}`);

    if (this.genderButtons) {
      setButtonSelected(this.genderButtons.male, this.profile.gender === 'male');
      setButtonSelected(this.genderButtons.female, this.profile.gender === 'female');
      setButtonSelected(this.handednessButtons.right, this.profile.handedness === 'right');
      setButtonSelected(this.handednessButtons.left, this.profile.handedness === 'left');
      setButtonSelected(this.teeButtons.back, this.profile.tee === 'back');
      setButtonSelected(this.teeButtons.forward, this.profile.tee === 'forward');
    }
  }

  private confirmSelection(): void {
    this.registry.set(PLAYER_PROFILE_REGISTRY_KEY, { ...this.profile });
    this.scene.start(SCENES.holeIntro);
  }
}
