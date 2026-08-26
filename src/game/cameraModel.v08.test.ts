import { describe, expect, it } from 'vitest';
import { CLUBS, PROTOTYPE_HOLE } from './data';
import {
  COURSE_VIEW_CENTRE_X,
  PUTTING_BALL_SCREEN_POSITION,
  ballAddressScreenX,
  bearingToPinFrom,
  courseViewStage,
  projectWorldToCourseView,
  puttingAimTargetScreenPosition,
  puttingCupScreenPosition,
  puttingGolferScreenX,
  puttingRollScreenPosition,
  puttingTargetScale,
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
  const ball = PUTTING_BALL_SCREEN_POSITION;
  const cup = puttingCupScreenPosition(10);

  it('places the ball and cup on one forward-facing centre line', () => {
    expect(ball.x).toBe(COURSE_VIEW_CENTRE_X);
    expect(cup.x).toBe(COURSE_VIEW_CENTRE_X);
    expect(cup.y).toBeLessThan(ball.y);
  });

  it('moves only the golfer stance when handedness changes', () => {
    const rightGolfer = puttingGolferScreenX('right');
    const leftGolfer = puttingGolferScreenX('left');

    expect(rightGolfer).toBeLessThan(ball.x);
    expect(leftGolfer).toBeGreaterThan(ball.x);
    expect(ball.x - rightGolfer).toBe(leftGolfer - ball.x);
  });

  it('keeps the physical cup fixed while the aim line pivots', () => {
    const straight = puttingAimTargetScreenPosition(ball, cup, 0);
    const aimed = puttingAimTargetScreenPosition(ball, cup, 4);

    expect(straight).toEqual(cup);
    expect(aimed.x).not.toBe(cup.x);
    expect(aimed.y).toBe(cup.y);
  });

  it('rolls straight up-screen and shows farther cups deeper in perspective', () => {
    const roll = puttingRollScreenPosition(ball, cup, 0.8, 0);
    const nearCup = puttingCupScreenPosition(2);
    const farCup = puttingCupScreenPosition(20);

    expect(roll.x).toBe(COURSE_VIEW_CENTRE_X);
    expect(roll.y).toBeLessThan(ball.y);
    expect(farCup.y).toBeLessThan(nearCup.y);
    expect(puttingTargetScale(20)).toBeLessThan(puttingTargetScale(2));
  });
});
