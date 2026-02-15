// E2E Test: Tournament System
import { test, expect } from './setup';

test.describe('Tournaments', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:3000/tournaments');
    await page.waitForLoadState('networkidle');
  });

  test('should display tournament list', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /tournaments/i })).toBeVisible();

    // Should show active tournaments or empty state
    const hasTournaments = await page.getByText(/holy tournament/i).isVisible();
    const hasEmptyState = await page.getByText(/no tournaments/i).isVisible();

    expect(hasTournaments || hasEmptyState).toBeTruthy();
  });

  test('should register for tournament', async ({ authenticatedPage: page }) => {
    // Find first available tournament
    const registerButton = page.getByRole('button', { name: /register/i }).first();

    if (await registerButton.isVisible()) {
      await registerButton.click();

      // Wait for confirmation modal
      await expect(page.getByRole('dialog')).toBeVisible();

      // Confirm registration
      await page.getByRole('button', { name: /confirm/i }).click();

      // Should show success message
      await expect(page.getByText(/registered successfully/i)).toBeVisible({ timeout: 5000 });
    } else {
      console.log('No tournaments available for registration');
    }
  });

  test('should view tournament bracket', async ({ authenticatedPage: page }) => {
    // Click on active tournament
    const tournamentCard = page.locator('[data-testid="tournament-card"]').first();

    if (await tournamentCard.isVisible()) {
      await tournamentCard.click();

      // Should show bracket view
      await expect(page.getByText(/bracket/i)).toBeVisible();
      await expect(page.getByRole('table')).toBeVisible();
    }
  });

  test('should display tournament leaderboard', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: /leaderboard/i }).click();

    // Should show rankings
    await expect(page.getByRole('table')).toBeVisible();
  });
});
