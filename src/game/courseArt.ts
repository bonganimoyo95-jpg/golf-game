import Phaser from 'phaser';
import { ASSETS } from './assets';
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
  scene.add
    .image(x, y, ASSETS.courseMap)
    .setOrigin(0)
    .setDisplaySize(width, height);
  const graphics = scene.add.graphics();

  graphics.lineStyle(2, COLORS.cream, 0.72);
  graphics.strokeRoundedRect(x, y, width, height, 6);

  const teeY = y + height - 17;
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
  scene.add
    .image(8, 201, ASSETS.coursePanorama)
    .setOrigin(0)
    .setDisplaySize(336, 151);
  const graphics = scene.add.graphics();

  graphics.lineStyle(2, COLORS.cream, 0.72);
  graphics.strokeRoundedRect(8, 201, 336, 151, 6);

  return graphics;
}
