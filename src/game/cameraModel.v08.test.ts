import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from './data';
import {
  COURSE_VIEW_CENTRE_X,
  ballAddressScreenX,
  bearingToPinFrom,
  courseViewStage,
  projectWorldToCourseView,
  puttingAimTargetScreenPosition,
  puttingRollScreenPosition,
  shotBallScreenPosition,
  shotCameraTravelMetres,
} from './cameraModel';
import { PIN_POSITION } from './courseModel';
import { calculateShot, sampleTrajectory } from './physics/shotPhysics';

const shot = calculateShot({
  start: { x: 0, y: 0 },
  club: CLUBS[0],
  power: 1,
  accuracyError: 0,
  aimDegrees: 0,
  wind: PROTOTYPE_HOLE.wind,
  startingLie: 'tee',
});

describe('position-aware course camera', () => {
  it('projects the pin to the centre when the view faces it from the ball', () => {
    const position = { x: 31, y: 238 };
    const pin = projectWorldToCourseView(PIN_POSITION, {
      position,
      bearingDegrees: bearingToPinFrom(position),
    });

    expect(pin.visible).toBe(true);
    expect(pin.x).toBeCloseTo(COURSE_VIEW_CENTRE_X, 5);
  });

  it('uses perspective scale instead of a fixed panorama crop', () => {
    const camera = { position: { x: 0, y: 100 }, bearingDegrees: 0 };
    const near = projectWorldToCourseView({ x: 10, y: 120 }, camera);
    const far = projectWorldToCourseView({ x: 10, y: 320 }, camera);

    expect(near.scale).toBeGreaterThan(far.scale);
    expect(near.y).toBeGreaterThan(far.y);
    expect(Math.abs(near.x - COURSE_VIEW_CENTRE_X)).toBeGreaterThan(
      Math.abs(far.x - COURSE_VIEW_CENTRE_X),
    );
  });

  it('moves the chase camera monotonically up the shot path', () => {
    const progressSamples = [0, 0.15, 0.35, 0.6, 0.8, 1];
    const travel = progressSamples.map((progress) =>
      shotCameraTravelMetres(
        shot,
        sampleTrajectory(shot, progress),
        progress,
      ),
    );

    expect(travel).toEqual([...travel].sort((a, b) => a - b));
    expect(travel.at(-1)).toBeGreaterThan(100);
  });

  it('launches from the mirrored address but follows one physical course', () => {
    const start = sampleTrajectory(shot, 0);
    const rightStart = shotBallScreenPosition(shot, start, 0, 'right');
    const leftStart = shotBallScreenPosition(shot, start, 0, 'left');
    const rightEnd = shotBallScreenPosition(shot, sampleTrajectory(shot, 1), 1, 'right');
    const leftEnd = shotBallScreenPosition(shot, sampleTrajectory(shot, 1), 1, 'left');

    expect(rightStart.x).toBe(ballAddressScreenX('right'));
    expect(leftStart.x).toBe(ballAddressScreenX('left'));
    expect(rightEnd).toEqual(leftEnd);
  });

  it('selects stable view stages from actual progress', () => {
    expect(courseViewStage({ x: 0, y: 0 }, 'tee')).toBe('tee');
    expect(courseViewStage({ x: 0, y: 210 }, 'fairway')).toBe('fairway');
    expect(courseViewStage({ x: 0, y: 340 }, 'fairway')).toBe('approach');
    expect(courseViewStage({ x: 0, y: 386 }, 'green')).toBe('green');
  });
});

describe('putting camera model', () => {
  const rightBall = { x: 132, y: 329 };
  const rightCup = { x: 329, y: 329 };
  const leftBall = { x: 220, y: 329 };
  const leftCup = { x: 23, y: 329 };

  it('keeps the physical cup fixed while the aim line moves', () => {
    const straight = puttingAimTargetScreenPosition(rightBall, rightCup, 0);
    const aimed = puttingAimTargetScreenPosition(rightBall, rightCup, 4);

    expect(straight).toEqual(rightCup);
    expect(aimed.x).toBe(rightCup.x);
    expect(aimed.y).not.toBe(rightCup.y);
  });

  it('mirrors putt direction for left-handed play', () => {
    const right = puttingRollScreenPosition(rightBall, rightCup, 0.8, 3);
    const left = puttingRollScreenPosition(leftBall, leftCup, 0.8, 3);

    expect(right.x).toBe(352 - left.x);
    expect(right.y + left.y).toBeCloseTo(658);
  });
});
