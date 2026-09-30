import { expect, test, type Page } from '@playwright/test';

async function activeScene(page: Page): Promise<string | undefined> {
  return page.evaluate(() =>
    window.__FAIRWAYS_GAME__?.scene.getScenes(true)[0]?.scene.key,
  );
}

async function waitForScene(page: Page, key: string): Promise<void> {
  await expect.poll(() => activeScene(page)).toBe(key);
}

async function clickGamePoint(page: Page, x: number, y: number): Promise<void> {
  const canvas = page.locator('#game-container canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Game canvas is not visible');
  await page.mouse.click(
    bounds.x + (x / 352) * bounds.width,
    bounds.y + (y / 440) * bounds.height,
  );
}

test('loads, teaches the loop, enters play, pauses and starts a shot', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/Fairways & Friends/);
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await waitForScene(page, 'TitleScene');

  await clickGamePoint(page, 176, 353);
  await waitForScene(page, 'GolferSelectScene');
  await clickGamePoint(page, 176, 397);
  await waitForScene(page, 'HoleIntroScene');
  await clickGamePoint(page, 176, 389);
  await waitForScene(page, 'GameScene');

  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as {
      tutorialObjects?: unknown[];
    };
    return scene?.tutorialObjects?.length ?? 0;
  })).toBeGreaterThan(0);

  await clickGamePoint(page, 176, 316);
  await clickGamePoint(page, 176, 316);
  await clickGamePoint(page, 176, 316);

  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as {
      phase?: string;
      distanceText?: { text?: string };
    };
    return { phase: scene?.phase, distance: scene?.distanceText?.text };
  })).toMatchObject({ phase: 'setup', distance: expect.stringContaining('PIN') });

  await clickGamePoint(page, 324, 26);
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as { phase?: string };
    return scene?.phase;
  })).toBe('paused');
  await clickGamePoint(page, 176, 118);

  await page.waitForTimeout(200);
  await clickGamePoint(page, 176, 398);
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as { phase?: string };
    return scene?.phase;
  })).toBe('power');

  await page.waitForTimeout(500);
  await clickGamePoint(page, 176, 398);
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as { phase?: string };
    return scene?.phase;
  })).toBe('accuracy');
  await page.waitForTimeout(220);
  await clickGamePoint(page, 176, 398);
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as { phase?: string };
    return scene?.phase;
  })).toBe('result');
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as {
      phase?: string;
      currentLie?: string;
      clubText?: { text?: string };
    };
    return { phase: scene.phase, lie: scene.currentLie, club: scene.clubText?.text };
  }), { timeout: 9_000 }).toMatchObject({
    phase: 'setup',
    lie: expect.not.stringMatching(/^tee$/),
    club: expect.not.stringContaining('DRV'),
  });

  expect(pageErrors).toEqual([]);
});

test('runs the auto-chip and distance-scaled putting scenarios', async ({ page }) => {
  await page.goto('/?qa=1');
  await waitForScene(page, 'TitleScene');
  await clickGamePoint(page, 293, 353);
  await waitForScene(page, 'QaScene');

  await clickGamePoint(page, 176, 258);
  await waitForScene(page, 'GameScene');
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as {
      clubText?: { text?: string };
      cameraText?: { text?: string };
    };
    return { club: scene.clubText?.text, guidance: scene.cameraText?.text };
  })).toMatchObject({
    club: expect.stringContaining('CHIP'),
    guidance: expect.not.stringContaining('%'),
  });

  await clickGamePoint(page, 324, 26);
  await clickGamePoint(page, 176, 260);
  await waitForScene(page, 'QaScene');
  await clickGamePoint(page, 290, 258);
  await waitForScene(page, 'GameScene');
  const shortBand = await page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as {
      currentPlan?: { selectedLow: { power: number }; selectedHigh: { power: number } };
    };
    const plan = scene.currentPlan!;
    return plan.selectedHigh.power - plan.selectedLow.power;
  });

  await clickGamePoint(page, 324, 26);
  await clickGamePoint(page, 176, 260);
  await waitForScene(page, 'QaScene');
  await clickGamePoint(page, 62, 303);
  await waitForScene(page, 'GameScene');
  const longBand = await page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as {
      currentPlan?: { selectedLow: { power: number }; selectedHigh: { power: number } };
    };
    const plan = scene.currentPlan!;
    return plan.selectedHigh.power - plan.selectedLow.power;
  });

  expect(longBand).toBeLessThan(shortBand);
});

test('fits the embedded portrait game without making the page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 352, height: 440 });
  await page.goto('/');
  const canvas = page.locator('#game-container canvas');
  await expect(canvas).toBeVisible();

  const layout = await page.evaluate(() => {
    const game = document.querySelector<HTMLElement>('#game-container')!;
    const rect = game.getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      ratio: rect.height / rect.width,
      headingDisplay: getComputedStyle(document.querySelector('.game-heading')!).display,
    };
  });

  expect(layout.documentHeight).toBeLessThanOrEqual(layout.viewportHeight);
  expect(layout.bodyHeight).toBeLessThanOrEqual(layout.viewportHeight);
  expect(layout.ratio).toBeCloseTo(1.25, 2);
  expect(layout.headingDisplay).toBe('none');
});

test('shows shot advice briefly, then clears it from the meter area', async ({ page }) => {
  await page.setViewportSize({ width: 352, height: 440 });
  await page.goto('/?qa=1');
  await waitForScene(page, 'TitleScene');
  await clickGamePoint(page, 293, 353);
  await waitForScene(page, 'QaScene');
  await clickGamePoint(page, 176, 258);
  await waitForScene(page, 'GameScene');

  const initialTip = await page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as {
      instructionText?: { text?: string; visible?: boolean };
    };
    return { text: scene?.instructionText?.text, visible: scene?.instructionText?.visible };
  });
  expect(initialTip.visible).toBe(true);
  expect(initialTip.text).toBeTruthy();

  await expect.poll(() => page.evaluate(() => {
    const scene = window.__FAIRWAYS_GAME__?.scene.getScene('GameScene') as unknown as {
      instructionText?: { visible?: boolean };
    };
    return scene?.instructionText?.visible;
  }), { timeout: 3_000 }).toBe(false);
});
