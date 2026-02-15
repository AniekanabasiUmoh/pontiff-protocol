// E2E Test: Confession System
import { test, expect } from './setup';

test.describe('Confession System', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:3000/confess');
    await page.waitForLoadState('networkidle');
  });

  test('should display confession form', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /confess/i })).toBeVisible();
    await expect(page.getByLabel(/stake amount/i)).toBeVisible();
  });

  test('should submit confession with stake', async ({ authenticatedPage: page }) => {
    // Enter stake amount
    const stakeInput = page.getByLabel(/stake amount/i);
    await stakeInput.fill('100');

    // Submit confession
    const confessButton = page.getByRole('button', { name: /confess/i });
    await confessButton.click();

    // Wait for transaction confirmation modal
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Confirm transaction (mocked)
    const confirmButton = page.getByRole('button', { name: /confirm/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should show success or pending message
    await expect(
      page.getByText(/(confession submitted|transaction pending)/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display sin score', async ({ authenticatedPage: page }) => {
    // Sin score should be visible
    await expect(page.getByText(/sin score/i)).toBeVisible();

    // Score value should be a number
    const scoreElement = page.locator('[data-testid="sin-score"]');
    if (await scoreElement.isVisible()) {
      const scoreText = await scoreElement.textContent();
      expect(scoreText).toMatch(/\d+/);
    }
  });

  test('should show confession history', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: /history/i }).click();

    // Should show history table or empty state
    const hasHistory = await page.getByRole('table').isVisible();
    const hasEmptyState = await page.getByText(/no confessions yet/i).isVisible();

    expect(hasHistory || hasEmptyState).toBeTruthy();
  });

  test('should opt-in to public roast', async ({ authenticatedPage: page }) => {
    // Find opt-in checkbox
    const optInCheckbox = page.getByLabel(/opt.*public/i);

    if (await optInCheckbox.isVisible()) {
      await optInCheckbox.check();

      // Checkbox should be checked
      await expect(optInCheckbox).toBeChecked();
    }
  });
});
