// Playwright E2E Test Setup
import { test as base, expect } from '@playwright/test';
import { BrowserContext, Page } from '@playwright/test';

// Extend base test with custom fixtures
export const test = base.extend({
  // Auto-connect wallet for authenticated tests
  authenticatedPage: async ({ page }, use) => {
    // Navigate to app
    await page.goto('http://localhost:3000');

    // Mock wallet connection (MetaMask)
    await page.evaluate(() => {
      (window as any).ethereum = {
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'];
          }
          if (method === 'eth_chainId') {
            return '0x1'; // Mainnet
          }
          if (method === 'personal_sign') {
            return '0xmocksignature';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    await use(page);
  },
});

export { expect };
