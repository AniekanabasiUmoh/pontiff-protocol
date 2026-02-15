// E2E Test: Authentication Flow
import { test, expect } from './setup';

test.describe('Authentication', () => {
  test('should display connect wallet button', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should connect wallet and show address', async ({ authenticatedPage: page }) => {
    // Click connect wallet
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await connectButton.click();

    // Wait for wallet address to appear
    await expect(page.getByText(/0x742d/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to dashboard after connection', async ({ authenticatedPage: page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await connectButton.click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show user balance after connection', async ({ authenticatedPage: page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await connectButton.click();

    // Wait for balance to load
    await expect(page.getByText(/GUILT/i)).toBeVisible({ timeout: 5000 });
  });

  test('should disconnect wallet', async ({ authenticatedPage: page }) => {
    // Connect first
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await connectButton.click();

    // Wait for connection
    await page.waitForTimeout(1000);

    // Find and click disconnect
    const disconnectButton = page.getByRole('button', { name: /disconnect/i });
    await disconnectButton.click();

    // Should show connect button again
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
  });
});
