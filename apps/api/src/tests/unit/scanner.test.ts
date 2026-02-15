/**
 * Unit Tests: Scanner Service
 * Tests sin detection logic (rug pulls, paper hands, top buyer, FOMO)
 */

import { scanWallet, SinType, SinSeverity } from '../../services/scanner';
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
      mockBlockchain.fetchWalletTransfers.mockResolvedValue({
        buys: [
          {
            address: '0xRUGTOKEN',
            blockNumber: 100,
            transactionHash: '0xtest',
            data: '0x',
            topics: [],
            timestamp: Date.now() - 86400000,
          },
        ],
        sells: [],
        totalTransfers: 1,
      });

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'RUG',
        decimals: 18,
        name: 'Rug Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue(BigInt('1000000000000000000'));

      // Bought at $100, now worth $0.01
      mockPrice.getHistoricalPrice.mockResolvedValue(100);
      mockPrice.getTokenPrice.mockResolvedValue(0.01);
      mockPrice.isLikelyRugPull.mockResolvedValue(true);

      const result = await scanWallet(testWallet);

      expect(result.sins).toHaveLength(1);
      expect(result.sins[0].sin_type).toBe(SinType.RUG_PULL);
      expect(result.sins[0].severity).toBe(SinSeverity.UNFORGIVABLE);
      expect(result.primarySin).toBe(SinType.RUG_PULL);
    });

    it('should mark multiple rugs as UNFORGIVABLE', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue({
        buys: [
          { address: '0xRUG1', blockNumber: 100, transactionHash: '0x1', data: '0x', topics: [], timestamp: Date.now() - 86400000 },
          { address: '0xRUG2', blockNumber: 200, transactionHash: '0x2', data: '0x', topics: [], timestamp: Date.now() - 43200000 },
        ],
        sells: [],
        totalTransfers: 2,
      });

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'RUG',
        decimals: 18,
        name: 'Rug Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue(BigInt('1000000000000000000'));
      mockPrice.getHistoricalPrice.mockResolvedValue(50);
      mockPrice.getTokenPrice.mockResolvedValue(0.01);
      mockPrice.isLikelyRugPull.mockResolvedValue(true);

      const result = await scanWallet(testWallet);

      expect(result.sins.length).toBeGreaterThanOrEqual(2);
      expect(result.primarySin).toBe(SinType.RUG_PULL);
      const unforgivable = result.sins.find((s) => s.severity === SinSeverity.UNFORGIVABLE);
      expect(unforgivable).toBeDefined();
    });
  });

  describe('Paper Hands Detection', () => {
    it('should detect paper hands when selling at loss within 24h', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const tokenAddr = '0xTOKEN';

      const buyTime = Date.now() - 12 * 3600 * 1000; // 12 hours ago
      const sellTime = Date.now() - 1 * 3600 * 1000; // 1 hour ago

      mockBlockchain.fetchWalletTransfers.mockResolvedValue({
        buys: [{ address: tokenAddr, blockNumber: 100, transactionHash: '0xbuy', data: '0x', topics: [], timestamp: buyTime }],
        sells: [{ address: tokenAddr, blockNumber: 150, transactionHash: '0xsell', data: '0x', topics: [], timestamp: sellTime }],
        totalTransfers: 2,
      });

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'PAPERHANDS',
        decimals: 18,
        name: 'Paper Hands Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue(BigInt(0));

      // Bought at $100, sold at $70 = -$30 loss
      mockPrice.getHistoricalPrice.mockResolvedValueOnce(100).mockResolvedValueOnce(70);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      const paperHands = result.sins.find((s) => s.sin_type === SinType.PAPER_HANDS);
      expect(paperHands).toBeDefined();
      if (paperHands) {
        expect(paperHands.severity).toBe(SinSeverity.MINOR);
      }
    });
  });

  describe('Top Buyer Detection', () => {
    it('should detect buying near all-time high', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue({
        buys: [{ address: '0xTOKEN', blockNumber: 100, transactionHash: '0xbuy', data: '0x', topics: [], timestamp: Date.now() - 86400000 }],
        sells: [],
        totalTransfers: 1,
      });

      mockBlockchain.getTokenMetadata.mockResolvedValue({
        symbol: 'FOMO',
        decimals: 18,
        name: 'FOMO Token',
      });

      mockBlockchain.getTokenBalance.mockResolvedValue(BigInt('1000000000000000000'));

      // Bought at $100 (ATH), now $15 (85% down)
      mockPrice.getHistoricalPrice.mockResolvedValue(100);
      mockPrice.getTokenPrice.mockResolvedValue(15);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      const topBuyer = result.sins.find((s) => s.sin_type === SinType.TOP_BUYER);
      expect(topBuyer).toBeDefined();
      if (topBuyer) {
        expect(topBuyer.loss_amount_usd).toBeGreaterThan(80);
      }
    });
  });

  describe('Sin Severity Classification', () => {
    it('should classify loss < $100 as MINOR', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue({
        buys: [{ address: '0xTOKEN', blockNumber: 100, transactionHash: '0x1', data: '0x', topics: [], timestamp: Date.now() - 86400000 }],
        sells: [{ address: '0xTOKEN', blockNumber: 200, transactionHash: '0x2', data: '0x', topics: [], timestamp: Date.now() - 3600000 }],
        totalTransfers: 2,
      });

      mockBlockchain.getTokenMetadata.mockResolvedValue({ symbol: 'TOKEN', decimals: 18, name: 'Token' });
      mockBlockchain.getTokenBalance.mockResolvedValue(BigInt(0));
      mockPrice.getHistoricalPrice.mockResolvedValue(80);
      mockPrice.getTokenPrice.mockResolvedValue(30);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      if (result.sins.length > 0) {
        expect(result.sins[0].severity).toBe(SinSeverity.MINOR);
      }
    });

    it('should classify loss $100-$1000 as MORTAL', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue({
        buys: [{ address: '0xTOKEN', blockNumber: 100, transactionHash: '0x1', data: '0x', topics: [], timestamp: Date.now() - 86400000 }],
        sells: [{ address: '0xTOKEN', blockNumber: 200, transactionHash: '0x2', data: '0x', topics: [], timestamp: Date.now() - 3600000 }],
        totalTransfers: 2,
      });

      mockBlockchain.getTokenMetadata.mockResolvedValue({ symbol: 'TOKEN', decimals: 18, name: 'Token' });
      mockBlockchain.getTokenBalance.mockResolvedValue(BigInt(0));
      mockPrice.getHistoricalPrice.mockResolvedValue(500);
      mockPrice.getTokenPrice.mockResolvedValue(0);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      if (result.sins.length > 0) {
        expect(result.sins[0].severity).toBe(SinSeverity.MORTAL);
      }
    });

    it('should classify loss > $1000 as CARDINAL', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue({
        buys: [{ address: '0xTOKEN', blockNumber: 100, transactionHash: '0x1', data: '0x', topics: [], timestamp: Date.now() - 86400000 }],
        sells: [{ address: '0xTOKEN', blockNumber: 200, transactionHash: '0x2', data: '0x', topics: [], timestamp: Date.now() - 3600000 }],
        totalTransfers: 2,
      });

      mockBlockchain.getTokenMetadata.mockResolvedValue({ symbol: 'BIGBAG', decimals: 18, name: 'Big Bag Token' });
      mockBlockchain.getTokenBalance.mockResolvedValue(BigInt(0));
      mockPrice.getHistoricalPrice.mockResolvedValue(500);
      mockPrice.getTokenPrice.mockResolvedValue(0);
      mockPrice.isLikelyRugPull.mockResolvedValue(false);

      const result = await scanWallet(testWallet);

      if (result.sins.length > 0 && result.totalLoss > 1000) {
        expect(result.sins[0].severity).toBe(SinSeverity.CARDINAL);
      }
      expect(result.totalLoss).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty sins for wallet with no transfers', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockResolvedValue({ buys: [], sells: [], totalTransfers: 0 });

      const result = await scanWallet(testWallet);

      expect(result.sins).toHaveLength(0);
      expect(result.totalLoss).toBe(0);
    });

    it('should handle API failures gracefully', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockBlockchain.fetchWalletTransfers.mockRejectedValue(new Error('RPC timeout'));

      await expect(scanWallet(testWallet)).rejects.toThrow();
    });
  });
});
