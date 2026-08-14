import Phaser from 'phaser';
import { COLORS } from './theme';

export interface CourseMapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function drawCourseMapBase(
  scene: Phaser.Scene,
  bounds: CourseMapBounds,
): Phaser.GameObjects.Graphics {
  const { x, y, width, height } = bounds;
  const graphics = scene.add.graphics();

  graphics.fillStyle(COLORS.tobacco, 1);
  graphics.fillRoundedRect(x - 2, y - 2, width + 4, height + 4, 8);
  graphics.fillStyle(COLORS.rough, 1);
  graphics.fillRoundedRect(x, y, width, height, 6);

  graphics.fillStyle(COLORS.water, 1);
  graphics.fillRoundedRect(x + 8, y + 25, 64, 76, 18);
  graphics.fillRoundedRect(x + width - 55, y + 68, 47, 62, 15);

  graphics.fillStyle(COLORS.fairway, 1);
  graphics.fillEllipse(x + width * 0.5, y + height * 0.76, width * 0.39, height * 0.48);
  graphics.fillEllipse(x + width * 0.56, y + height * 0.47, width * 0.47, height * 0.48);
  graphics.fillEllipse(x + width * 0.48, y + height * 0.22, width * 0.34, height * 0.28);

  graphics.fillStyle(COLORS.fairwayLight, 0.3);
  graphics.fillEllipse(x + width * 0.47, y + height * 0.58, width * 0.22, height * 0.52);

  graphics.fillStyle(COLORS.bunker, 1);
  graphics.fillEllipse(x + width * 0.34, y + height * 0.22, 29, 12);
  graphics.fillEllipse(x + width * 0.65, y + height * 0.3, 25, 11);

  graphics.fillStyle(COLORS.green, 1);
  graphics.fillEllipse(x + width * 0.5, y + 22, 58, 28);

  const teeY = y + height - 17;
  graphics.fillStyle(COLORS.green, 1);
  graphics.fillRoundedRect(x + width * 0.5 - 18, teeY - 8, 36, 16, 4);
  graphics.fillStyle(COLORS.cream, 1);
  graphics.fillCircle(x + width * 0.5 - 7, teeY, 2);
  graphics.fillCircle(x + width * 0.5 + 7, teeY, 2);

  const cupX = x + width * 0.5;
  const cupY = y + 21;
  graphics.lineStyle(2, COLORS.cream, 1);
  graphics.lineBetween(cupX, cupY - 15, cupX, cupY + 2);
  graphics.fillStyle(COLORS.orange, 1);
  graphics.fillTriangle(cupX, cupY - 15, cupX + 13, cupY - 10, cupX, cupY - 6);

  return graphics;
}

export function drawLandscape(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  graphics.fillStyle(COLORS.sky, 1);
  graphics.fillRect(8, 201, 336, 151);
  graphics.fillStyle(COLORS.cream, 0.35);
  graphics.fillCircle(306, 226, 13);

  graphics.fillStyle(COLORS.rough, 1);
  graphics.fillTriangle(8, 275, 88, 222, 166, 275);
  graphics.fillTriangle(104, 275, 198, 216, 286, 275);
  graphics.fillTriangle(222, 275, 309, 230, 344, 263);

  graphics.fillStyle(COLORS.fairway, 1);
  graphics.fillRect(8, 271, 336, 81);
  graphics.fillStyle(COLORS.fairwayLight, 0.32);
  graphics.fillRect(8, 295, 336, 5);
  graphics.fillRect(8, 317, 336, 4);

  graphics.lineStyle(2, COLORS.tobacco, 1);
  graphics.strokeRoundedRect(8, 201, 336, 151, 6);

  return graphics;
}
