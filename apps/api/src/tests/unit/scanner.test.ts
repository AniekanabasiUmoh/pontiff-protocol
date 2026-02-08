/**
 * Unit Tests: Scanner Service
 * Tests sin detection logic (rug pulls, paper hands, top buyer, FOMO)
 */

import { scanWallet } from '../../services/scanner';
import * as blockchain from '../../services/blockchain';
import * as price from '../../services/price';

// Mock dependencies
jest.mock('../../services/blockchain');
jest.mock('../../services/price');

const mockBlockchain = blockchain as jest.Mocked<typeof blockchain>;
const mockPrice = price as jest.Mocked<typeof price>;

describe('Scanner Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rug Pull Detection', () => {
    it('should detect rug pull when token value drops to near zero', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      // Mock transfer history: bought token, price crashed
      mockBlockchain.fetchWalletTransfers.mockResolvedValue([
        {
          tokenAddress: '0xRUGTOKEN',
          from: '0xDEX',
          to: testWallet,
          amount: '1000000000000000000', // 1 token
          blockNumber: 100,
          timestamp: Date.now() - 86400000, // 1 day ago
        },
      ]);

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'RUG',
        decimals: 18,
        name: 'Rug Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue('1000000000000000000'); // Still holds it

      // Bought at $100, now worth $0.01
      mockPrice.getHistoricalPrice.mockResolvedValue(100);
      mockPrice.getTokenPrice.mockResolvedValue(0.01);
      mockPrice.isLikelyRugPull.mockResolvedValue(true);

      const result = await scanWallet(testWallet);

      expect(result.sins).toHaveLength(1);
      expect(result.sins[0].type).toBe('RUG_PULL');
      expect(result.sins[0].severity).toBe('CARDINAL'); // Lost ~$100
      expect(result.primarySin).toBe('RUG_PULL');
    });

    it('should mark multiple rugs as UNFORGIVABLE', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue([
        {
          tokenAddress: '0xRUG1',
          from: '0xDEX',
          to: testWallet,
          amount: '1000000000000000000',
          blockNumber: 100,
          timestamp: Date.now() - 86400000,
        },
        {
          tokenAddress: '0xRUG2',
          from: '0xDEX',
          to: testWallet,
          amount: '1000000000000000000',
          blockNumber: 200,
          timestamp: Date.now() - 43200000,
        },
      ]);

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'RUG',
        decimals: 18,
        name: 'Rug Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue('1000000000000000000');
      mockPrice.getHistoricalPrice.mockResolvedValue(50);
      mockPrice.getTokenPrice.mockResolvedValue(0.01);
      mockPrice.isLikelyRugPull.mockResolvedValue(true);

      const result = await scanWallet(testWallet);

      expect(result.sins.length).toBeGreaterThanOrEqual(2);
      expect(result.primarySin).toBe('RUG_PULL');
      // Should have UNFORGIVABLE severity for multiple rugs
      const unforgivable = result.sins.find((s) => s.severity === 'UNFORGIVABLE');
      expect(unforgivable).toBeDefined();
    });
  });

  describe('Paper Hands Detection', () => {
    it('should detect paper hands when selling at loss within 24h', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const tokenAddr = '0xTOKEN';

      const buyTime = Date.now() - 12 * 3600 * 1000; // 12 hours ago
      const sellTime = Date.now() - 1 * 3600 * 1000; // 1 hour ago

      mockBlockchain.fetchWalletTransfers.mockResolvedValue([
        {
          tokenAddress: tokenAddr,
          from: '0xDEX',
          to: testWallet,
          amount: '1000000000000000000', // Buy
          blockNumber: 100,
          timestamp: buyTime,
        },
        {
          tokenAddress: tokenAddr,
          from: testWallet,
          to: '0xDEX',
          amount: '1000000000000000000', // Sell
          blockNumber: 150,
          timestamp: sellTime,
        },
      ]);

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'PAPERHANDS',
        decimals: 18,
        name: 'Paper Hands Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue('0'); // Sold all

      // Bought at $100, sold at $70 = -$30 loss
      mockPrice.getHistoricalPrice.mockResolvedValueOnce(100).mockResolvedValueOnce(70);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      const paperHands = result.sins.find((s) => s.type === 'PAPER_HANDS');
      expect(paperHands).toBeDefined();
      expect(paperHands?.severity).toBe('MINOR'); // $30 loss
    });
  });

  describe('Top Buyer Detection', () => {
    it('should detect buying near all-time high', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue([
        {
          tokenAddress: '0xTOKEN',
          from: '0xDEX',
          to: testWallet,
          amount: '1000000000000000000',
          blockNumber: 100,
          timestamp: Date.now() - 86400000,
        },
      ]);

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'FOMO',
        decimals: 18,
        name: 'FOMO Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue('1000000000000000000');

      // Bought at $100 (ATH), now $15 (85% down)
      mockPrice.getHistoricalPrice.mockResolvedValue(100);
      mockPrice.getTokenPrice.mockResolvedValue(15);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      const topBuyer = result.sins.find((s) => s.type === 'TOP_BUYER');
      expect(topBuyer).toBeDefined();
      expect(topBuyer?.lossUSD).toBeGreaterThan(80);
    });
  });

  describe('Sin Severity Classification', () => {
    it('should classify loss < $100 as MINOR', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue([
        {
          tokenAddress: '0xTOKEN',
          from: '0xDEX',
          to: testWallet,
          amount: '1000000000000000000',
          blockNumber: 100,
          timestamp: Date.now() - 86400000,
        },
      ]);

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'TOKEN',
        decimals: 18,
        name: 'Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue('0');
      mockPrice.getHistoricalPrice.mockResolvedValue(80);
      mockPrice.getTokenPrice.mockResolvedValue(30);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      expect(result.sins[0].severity).toBe('MINOR');
    });

    it('should classify loss $100-$1000 as MORTAL', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue([
        {
          tokenAddress: '0xTOKEN',
          from: '0xDEX',
          to: testWallet,
          amount: '1000000000000000000',
          blockNumber: 100,
          timestamp: Date.now() - 86400000,
        },
      ]);

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'TOKEN',
        decimals: 18,
        name: 'Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue('0');
      mockPrice.getHistoricalPrice.mockResolvedValue(500);
      mockPrice.getTokenPrice.mockResolvedValue(0);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      expect(result.sins[0].severity).toBe('MORTAL');
    });

    it('should classify loss > $1000 as CARDINAL', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue([
        {
          tokenAddress: '0xTOKEN',
          from: '0xDEX',
          to: testWallet,
          amount: '5000000000000000000', // 5 tokens
          blockNumber: 100,
          timestamp: Date.now() - 86400000,
        },
      ]);

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'BIGBAG',
        decimals: 18,
        name: 'Big Bag Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue('0');
      mockPrice.getHistoricalPrice.mockResolvedValue(500); // Bought at $500/token = $2500 total
      mockPrice.getTokenPrice.mockResolvedValue(0);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      expect(result.sins[0].severity).toBe('CARDINAL');
      expect(result.totalLossUSD).toBeGreaterThan(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty sins for wallet with no transfers', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue([]);

      const result = await scanWallet(testWallet);

      expect(result.sins).toHaveLength(0);
      expect(result.totalLossUSD).toBe(0);
      expect(result.primarySin).toBeNull();
    });

    it('should handle API failures gracefully', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockRejectedValue(new Error('RPC timeout'));

      await expect(scanWallet(testWallet)).rejects.toThrow();
    });
  });
});
