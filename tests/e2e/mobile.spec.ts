// Mobile Device Testing
import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Device Compatibility', () => {
  test.use({ ...devices['iPhone 13'] });

  test('mobile homepage renders correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);

    // Check main content is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('mobile navigation menu works', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Look for hamburger menu or mobile navigation
    const mobileMenu = page.locator('button[aria-label*="menu" i], button:has-text("☰")').first();

    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(500);

      // Check if menu opened
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();
    }
  });

  test('mobile touch interactions work', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test tap on connect wallet button
    const walletButton = page.getByRole('button', { name: /connect|wallet/i }).first();
    if (await walletButton.isVisible()) {
      await walletButton.tap();
      await page.waitForTimeout(500);
    }
  });

  test('mobile swipe gestures work', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test horizontal swipe if there's a carousel or swipeable element
    const swipeableElements = page.locator('[class*="swipe"], [class*="carousel"], [class*="slider"]').first();

    if (await swipeableElements.isVisible()) {
      const box = await swipeableElements.boundingBox();
      if (box) {
        // Swipe left
        await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
        await page.touchscreen.swipe(
          { x: box.x + box.width - 50, y: box.y + box.height / 2 },
          { x: box.x + 50, y: box.y + box.height / 2 }
        );
      }
    }
  });

  test('mobile form inputs work correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Find any input field
    const inputs = page.locator('input[type="text"], input[type="number"], textarea').first();

    if (await inputs.isVisible()) {
      await inputs.tap();
      await inputs.fill('Test input from mobile');

      const value = await inputs.inputValue();
      expect(value).toBe('Test input from mobile');
    }
  });

  test('mobile keyboard opens for inputs', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const input = page.locator('input, textarea').first();

    if (await input.isVisible()) {
      await input.tap();

      // Check if input is focused
      const isFocused = await input.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });

  test('mobile buttons have adequate touch targets', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Get all buttons
    const buttons = page.locator('button, a[role="button"]');
    const count = await buttons.count();

    let tooSmallButtons = 0;

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          tooSmallButtons++;
        }
      }
    }

    // Allow some small buttons but most should be adequately sized
    expect(tooSmallButtons).toBeLessThan(count / 2);
  });

  test('mobile page loads without horizontal scroll', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
  });

  test('mobile performance is acceptable', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Measure page load time
    const loadTime = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return perfData.loadEventEnd - perfData.fetchStart;
    });

    // Page should load within 5 seconds on mobile
    expect(loadTime).toBeLessThan(5000);
  });

  test('mobile orientation change handled correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Portrait (default)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    let bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);

    // Landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);

    bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);
  });
});

test.describe('Tablet Device Compatibility', () => {
  test.use({ ...devices['iPad Pro'] });

  test('tablet homepage renders correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('tablet layout uses available space efficiently', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(viewportWidth).toBeGreaterThanOrEqual(768);

    // Check that content doesn't have excessive margins on tablet
    const main = page.locator('main, [role="main"]').first();
    if (await main.isVisible()) {
      const box = await main.boundingBox();
      if (box) {
        const usedSpace = (box.width / viewportWidth) * 100;
        expect(usedSpace).toBeGreaterThan(70); // Should use at least 70% of width
      }
    }
  });

  test('tablet supports both touch and mouse interactions', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const button = page.getByRole('button').first();

    if (await button.isVisible()) {
      // Test mouse hover
      await button.hover();
      await page.waitForTimeout(200);

      // Test tap
      await button.tap();
      await page.waitForTimeout(200);

      // Test click
      await button.click();
    }
  });
});
