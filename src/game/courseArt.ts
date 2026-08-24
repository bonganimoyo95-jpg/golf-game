import Phaser from 'phaser';
import {
  COURSE_VIEW_CENTRE_X,
  COURSE_VIEW_HEIGHT,
  COURSE_VIEW_HORIZON_Y,
  COURSE_VIEW_LEFT,
  COURSE_VIEW_TOP,
  COURSE_VIEW_WIDTH,
  LANDSCAPE_GROUND_Y,
  projectWorldToCourseView,
  worldToCameraSpace,
  type CourseCamera,
} from './cameraModel';
import {
  COURSE_DEFINITION,
  sampleFairway,
  type EllipseSurface,
} from './courseDefinition';
import {
  worldToMapWithin,
  type CourseMapBounds,
  type WorldPosition,
} from './courseModel';
import type { Lie } from './data';
import { COLORS } from './theme';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function mappedEllipse(
  surface: EllipseSurface,
  bounds: CourseMapBounds,
): { centre: WorldPosition; width: number; height: number } {
  const centre = worldToMapWithin(surface.centre, bounds);
  const horizontalEdge = worldToMapWithin(
    { x: surface.centre.x + surface.radiusX, y: surface.centre.y },
    bounds,
  );
  const verticalEdge = worldToMapWithin(
    { x: surface.centre.x, y: surface.centre.y + surface.radiusY },
    bounds,
  );
  return {
    centre,
    width: Math.abs(horizontalEdge.x - centre.x) * 2,
    height: Math.abs(verticalEdge.y - centre.y) * 2,
  };
}

function drawMapSurface(
  graphics: Phaser.GameObjects.Graphics,
  surface: EllipseSurface,
  bounds: CourseMapBounds,
): void {
  const ellipse = mappedEllipse(surface, bounds);
  const color =
    surface.lie === 'water'
      ? COLORS.water
      : surface.lie === 'bunker'
        ? COLORS.bunker
        : COLORS.green;
  graphics.fillStyle(color, 1);
  graphics.fillEllipse(
    ellipse.centre.x,
    ellipse.centre.y,
    ellipse.width,
    ellipse.height,
  );
  graphics.lineStyle(
    1,
    surface.lie === 'water' ? COLORS.sky : COLORS.cream,
    surface.lie === 'green' ? 0.38 : 0.56,
  );
  graphics.strokeEllipse(
    ellipse.centre.x,
    ellipse.centre.y,
    ellipse.width,
    ellipse.height,
  );
}

export function drawCourseMapBase(
  scene: Phaser.Scene,
  bounds: CourseMapBounds,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  graphics.fillStyle(COLORS.rough, 1);
  graphics.fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 6);

  // A deterministic stipple gives the rough some depth without introducing a
  // second, non-playable source of course geometry.
  graphics.fillStyle(COLORS.fairway, 0.36);
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 14; column += 1) {
      const x = bounds.x + 9 + column * (bounds.width - 18) / 13;
      const y = bounds.y + 8 + row * (bounds.height - 16) / 7;
      if ((row * 5 + column * 3) % 4 === 0) graphics.fillCircle(x, y, 1.2);
    }
  }

  const fairway = sampleFairway(8);
  const left = fairway.map((sample) => worldToMapWithin(sample.left, bounds));
  const right = fairway
    .map((sample) => worldToMapWithin(sample.right, bounds))
    .reverse();
  graphics.fillStyle(COLORS.fairway, 1);
  graphics.fillPoints([...left, ...right], true);
  graphics.lineStyle(1, COLORS.fairwayLight, 0.72);
  graphics.strokePoints([...left, ...right], true);

  for (const surface of COURSE_DEFINITION.surfaces.filter(
    (candidate) => candidate.lie === 'water',
  )) {
    drawMapSurface(graphics, surface, bounds);
  }
  for (const surface of COURSE_DEFINITION.surfaces.filter(
    (candidate) => candidate.lie === 'green',
  )) {
    drawMapSurface(graphics, surface, bounds);
  }
  for (const surface of COURSE_DEFINITION.surfaces.filter(
    (candidate) => candidate.lie === 'bunker',
  )) {
    drawMapSurface(graphics, surface, bounds);
  }

  for (const tee of COURSE_DEFINITION.tees) {
    const centre = worldToMapWithin(tee.centre, bounds);
    graphics.fillStyle(COLORS.cream, 0.92);
    graphics.fillRoundedRect(centre.x - 7, centre.y - 2, 14, 4, 1);
  }

  const pin = worldToMapWithin(COURSE_DEFINITION.pin, bounds);
  graphics.lineStyle(2, COLORS.cream, 1);
  graphics.lineBetween(pin.x, pin.y - 14, pin.x, pin.y + 2);
  graphics.fillStyle(COLORS.orange, 1);
  graphics.fillTriangle(pin.x, pin.y - 14, pin.x + 13, pin.y - 9, pin.x, pin.y - 5);

  graphics.lineStyle(2, COLORS.cream, 0.72);
  graphics.strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 6);
  return graphics;
}

export function drawLandscapeFrame(
  scene: Phaser.Scene,
): Phaser.GameObjects.Graphics {
  const frame = scene.add.graphics();
  frame.lineStyle(2, COLORS.cream, 0.72);
  frame.strokeRoundedRect(
    COURSE_VIEW_LEFT,
    COURSE_VIEW_TOP,
    COURSE_VIEW_WIDTH,
    COURSE_VIEW_HEIGHT,
    6,
  );
  return frame;
}

interface PerspectiveOptions {
  camera: CourseCamera;
  currentLie: Lie;
}

function courseViewPoint(point: WorldPosition, camera: CourseCamera): WorldPosition {
  const projected = projectWorldToCourseView(point, camera);
  return {
    x: clamp(
      projected.x,
      COURSE_VIEW_LEFT + 1,
      COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH - 1,
    ),
    y: clamp(projected.y, COURSE_VIEW_HORIZON_Y, COURSE_VIEW_TOP + COURSE_VIEW_HEIGHT),
  };
}

function drawPerspectiveFairway(
  graphics: Phaser.GameObjects.Graphics,
  camera: CourseCamera,
): void {
  const sections = sampleFairway(7)
    .map((sample) => ({
      ...sample,
      forward: worldToCameraSpace(
        { x: (sample.left.x + sample.right.x) / 2, y: sample.y },
        camera,
      ).forwardMetres,
    }))
    .filter((sample) => sample.forward >= -3 && sample.forward <= 470)
    .sort((a, b) => a.forward - b.forward);

  if (sections.length < 2) return;
  const left = sections.map((sample) => courseViewPoint(sample.left, camera));
  const right = sections
    .map((sample) => courseViewPoint(sample.right, camera))
    .reverse();
  const polygon = [...left, ...right];
  graphics.fillStyle(COLORS.fairway, 1);
  graphics.fillPoints(polygon, true);
  graphics.lineStyle(1, COLORS.fairwayLight, 0.64);
  graphics.strokePoints(polygon, true);

  graphics.lineStyle(1, COLORS.fairwayLight, 0.2);
  for (let index = 3; index < sections.length; index += 5) {
    const a = courseViewPoint(sections[index].left, camera);
    const b = courseViewPoint(sections[index].right, camera);
    graphics.lineBetween(a.x, a.y, b.x, b.y);
  }
}

function drawPerspectiveSurface(
  graphics: Phaser.GameObjects.Graphics,
  surface: EllipseSurface,
  camera: CourseCamera,
): void {
  const projected = projectWorldToCourseView(surface.centre, camera);
  if (!projected.visible) return;
  const width = clamp(surface.radiusX * 4.6 * projected.scale, 4, 150);
  const height = clamp(surface.radiusY * 0.8 * projected.scale, 3, 78);
  if (
    projected.x + width / 2 < COURSE_VIEW_LEFT ||
    projected.x - width / 2 > COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH
  ) {
    return;
  }

  const color =
    surface.lie === 'water'
      ? COLORS.water
      : surface.lie === 'bunker'
        ? COLORS.bunker
        : COLORS.green;
  graphics.fillStyle(color, surface.lie === 'green' ? 0.96 : 1);
  graphics.fillEllipse(projected.x, projected.y, width, height);
  graphics.lineStyle(
    Math.max(1, Math.round(projected.scale * 2)),
    surface.lie === 'water' ? COLORS.sky : COLORS.cream,
    0.58,
  );
  graphics.strokeEllipse(projected.x, projected.y, width, height);

  if (surface.lie === 'water') {
    graphics.lineStyle(1, COLORS.cream, 0.24);
    graphics.lineBetween(
      projected.x - width * 0.3,
      projected.y,
      projected.x + width * 0.22,
      projected.y,
    );
  }
}

function drawForegroundLie(
  graphics: Phaser.GameObjects.Graphics,
  currentLie: Lie,
): void {
  if (currentLie === 'bunker') {
    graphics.fillStyle(COLORS.bunker, 0.98);
    graphics.fillEllipse(COURSE_VIEW_CENTRE_X, LANDSCAPE_GROUND_Y + 8, 230, 48);
    graphics.lineStyle(2, COLORS.cream, 0.45);
    graphics.strokeEllipse(COURSE_VIEW_CENTRE_X, LANDSCAPE_GROUND_Y + 8, 230, 48);
    return;
  }

  if (currentLie === 'rough') {
    graphics.lineStyle(1, COLORS.fairwayLight, 0.7);
    for (let x = COURSE_VIEW_LEFT + 5; x < COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH; x += 12) {
      graphics.lineBetween(x, 349, x + 4, 334);
    }
    return;
  }

  if (currentLie === 'tee' || currentLie === 'fairway') {
    graphics.fillStyle(COLORS.fairwayLight, 0.12);
    for (let x = COURSE_VIEW_LEFT; x < COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH; x += 42) {
      graphics.fillRect(x, 320, 21, 31);
    }
  }
}

export function drawCoursePerspective(
  graphics: Phaser.GameObjects.Graphics,
  options: PerspectiveOptions,
): void {
  graphics.clear();
  graphics.fillStyle(COLORS.sky, 1);
  graphics.fillRect(
    COURSE_VIEW_LEFT,
    COURSE_VIEW_TOP,
    COURSE_VIEW_WIDTH,
    COURSE_VIEW_HORIZON_Y - COURSE_VIEW_TOP,
  );
  graphics.fillStyle(COLORS.cream, 0.13);
  graphics.fillCircle(COURSE_VIEW_LEFT + 265, COURSE_VIEW_TOP + 22, 13);

  graphics.fillStyle(COLORS.tobacco, 0.62);
  graphics.fillPoints(
    [
      { x: COURSE_VIEW_LEFT, y: COURSE_VIEW_HORIZON_Y },
      { x: COURSE_VIEW_LEFT + 55, y: COURSE_VIEW_HORIZON_Y - 20 },
      { x: COURSE_VIEW_LEFT + 112, y: COURSE_VIEW_HORIZON_Y - 6 },
      { x: COURSE_VIEW_LEFT + 175, y: COURSE_VIEW_HORIZON_Y - 25 },
      { x: COURSE_VIEW_LEFT + 244, y: COURSE_VIEW_HORIZON_Y - 9 },
      { x: COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH, y: COURSE_VIEW_HORIZON_Y - 19 },
      { x: COURSE_VIEW_LEFT + COURSE_VIEW_WIDTH, y: COURSE_VIEW_HORIZON_Y },
    ],
    true,
  );
  graphics.fillStyle(COLORS.rough, 1);
  graphics.fillRect(
    COURSE_VIEW_LEFT,
    COURSE_VIEW_HORIZON_Y,
    COURSE_VIEW_WIDTH,
    COURSE_VIEW_TOP + COURSE_VIEW_HEIGHT - COURSE_VIEW_HORIZON_Y,
  );

  drawPerspectiveFairway(graphics, options.camera);
  const visibleSurfaces = [...COURSE_DEFINITION.surfaces].sort((a, b) => {
    const aForward = worldToCameraSpace(a.centre, options.camera).forwardMetres;
    const bForward = worldToCameraSpace(b.centre, options.camera).forwardMetres;
    return bForward - aForward;
  });
  for (const surface of visibleSurfaces) {
    drawPerspectiveSurface(graphics, surface, options.camera);
  }
  drawForegroundLie(graphics, options.currentLie);
}
