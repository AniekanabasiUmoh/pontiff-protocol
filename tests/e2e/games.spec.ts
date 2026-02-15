// E2E Test: Game Playing Flows
import { test, expect } from './setup';

test.describe('Game Playing', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Connect wallet and navigate to games
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display available games', async ({ authenticatedPage: page }) => {
    // Check for game options
    await expect(page.getByText(/rock paper scissors/i)).toBeVisible();
    await expect(page.getByText(/poker/i)).toBeVisible();
    await expect(page.getByText(/judas/i)).toBeVisible();
  });

  test('should play Rock Paper Scissors', async ({ authenticatedPage: page }) => {
    // Click RPS game
    await page.getByRole('button', { name: /rock paper scissors/i }).click();

    // Wait for game modal
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select Rock
    await page.getByRole('button', { name: /rock/i }).click();

    // Wait for result
    await expect(page.getByText(/you (won|lost|tied)/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display game history', async ({ authenticatedPage: page }) => {
    // Navigate to history
    await page.getByRole('link', { name: /history/i }).click();

    // Should show game history table
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should show leaderboard', async ({ authenticatedPage: page }) => {
    // Navigate to leaderboard
    await page.getByRole('link', { name: /leaderboard/i }).click();

    // Should show leaderboard tabs
    await expect(page.getByRole('tab', { name: /saints/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /sinners/i })).toBeVisible();
  });

  test('should wagering input validation', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /rock paper scissors/i }).click();

    // Try to set invalid wager
    const wagerInput = page.getByLabel(/wager/i);
    await wagerInput.fill('-1');

    const playButton = page.getByRole('button', { name: /play/i });
    await expect(playButton).toBeDisabled();

    // Set valid wager
    await wagerInput.fill('10');
    await expect(playButton).toBeEnabled();
  });
});
