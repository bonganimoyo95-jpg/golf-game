import Phaser from 'phaser';
import './styles.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { GolferSelectScene } from './game/scenes/GolferSelectScene';
import { HoleIntroScene } from './game/scenes/HoleIntroScene';
import { ResultScene } from './game/scenes/ResultScene';
import { TitleScene } from './game/scenes/TitleScene';
import { COLORS } from './game/theme';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.espresso,
  pixelArt: true,
  roundPixels: true,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: {
    activePointers: 3,
  },
  scene: [
    BootScene,
    TitleScene,
    GolferSelectScene,
    HoleIntroScene,
    GameScene,
    ResultScene,
  ],
};

new Phaser.Game(config);
