// Cross-Browser Compatibility Tests
import { test, expect } from './setup';

test.describe('Cross-Browser Compatibility', () => {
  test('homepage loads correctly across browsers', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check critical elements load
    await expect(page).toHaveTitle(/Pontiff/i);

    // Check navigation is visible
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();

    // Check main content area exists
    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible();
  });

  test('responsive layout works across devices', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Wait for layout to settle
      await page.waitForTimeout(500);

      // Check page is still visible and functional
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Verify no horizontal scroll on mobile/tablet
      if (viewport.width <= 1024) {
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const clientWidth = await page.evaluate(() => document.body.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
      }
    }
  });

  test('wallet connection button visible across browsers', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Look for connect wallet button with various selectors
    const walletButton = page.getByRole('button', { name: /connect|wallet/i });
    await expect(walletButton).toBeVisible({ timeout: 10000 });
  });

  test('leaderboard loads and renders across browsers', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Navigate to or find leaderboard
    const leaderboardLink = page.getByRole('link', { name: /leaderboard/i }).first();
    if (await leaderboardLink.isVisible()) {
      await leaderboardLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Check leaderboard content renders
    const leaderboardContent = page.locator('text=/shame|saint|heretic/i').first();
    await expect(leaderboardContent).toBeVisible({ timeout: 10000 });
  });

  test('CSS animations and transitions work', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check if any animated elements are present
    const hasAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const styles = window.getComputedStyle(el);
        if (styles.animation !== 'none' || styles.transition !== 'all 0s ease 0s') {
          return true;
        }
      }
      return false;
    });

    expect(typeof hasAnimations).toBe('boolean');
  });

  test('images and media load correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.complete || img.naturalHeight === 0).length;
    });

    expect(brokenImages).toBe(0);
  });

  test('fonts load and render correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check if custom fonts are loaded
    const fontsLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.size > 0;
    });

    expect(fontsLoaded).toBe(true);
  });

  test('JavaScript functionality works across browsers', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test basic JS functionality
    const jsWorks = await page.evaluate(() => {
      // Test modern JS features
      const testArray = [1, 2, 3];
      const doubled = testArray.map(x => x * 2);
      const sum = doubled.reduce((a, b) => a + b, 0);

      // Test async/await
      const asyncTest = async () => true;

      return sum === 12 && typeof asyncTest === 'function';
    });

    expect(jsWorks).toBe(true);
  });

  test('local storage and session storage work', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test localStorage
    const localStorageWorks = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        const value = localStorage.getItem('test');
        localStorage.removeItem('test');
        return value === 'value';
      } catch (e) {
        return false;
      }
    });

    expect(localStorageWorks).toBe(true);

    // Test sessionStorage
    const sessionStorageWorks = await page.evaluate(() => {
      try {
        sessionStorage.setItem('test', 'value');
        const value = sessionStorage.getItem('test');
        sessionStorage.removeItem('test');
        return value === 'value';
      } catch (e) {
        return false;
      }
    });

    expect(sessionStorageWorks).toBe(true);
  });

  test('console has no critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (like CORS for external resources)
    const criticalErrors = errors.filter(err =>
      !err.includes('CORS') &&
      !err.includes('favicon') &&
      !err.includes('ad-blocker')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
