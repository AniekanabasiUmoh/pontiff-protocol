/**
 * Unit Tests: Price Service
 * Tests cascade price oracle (Pyth → DEX → CoinGecko → Mock)
 */

import { getTokenPrice, getHistoricalPrice, isLikelyRugPull } from '../../services/price';
import axios from 'axios';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('Price Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTokenPrice - Cascade Oracle', () => {
    it('should return Pyth Oracle price if available', async () => {
      const tokenAddress = '0xTOKEN';

      // Mock Pyth Oracle success
      mockAxios.get.mockResolvedValueOnce({
        data: {
          price: 42.5,
          confidence: 0.1,
        },
      });

      const price = await getTokenPrice(tokenAddress);

      expect(price).toBe(42.5);
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('pyth'),
        expect.any(Object)
      );
    });

    it('should fallback to DEX Router if Pyth fails', async () => {
      const tokenAddress = '0xTOKEN';

      // Pyth fails
      mockAxios.get.mockRejectedValueOnce(new Error('Pyth unavailable'));

      // DEX Router succeeds
      mockAxios.get.mockResolvedValueOnce({
        data: {
          price: 35.0,
        },
      });

      const price = await getTokenPrice(tokenAddress);

      expect(price).toBe(35.0);
      expect(mockAxios.get).toHaveBeenCalledTimes(2); // Pyth + DEX
    });

    it('should fallback to CoinGecko if DEX fails', async () => {
      const tokenAddress = '0xTOKEN';

      // Pyth fails
      mockAxios.get.mockRejectedValueOnce(new Error('Pyth unavailable'));

      // DEX fails
      mockAxios.get.mockRejectedValueOnce(new Error('DEX unavailable'));

      // CoinGecko succeeds
      mockAxios.get.mockResolvedValueOnce({
        data: {
          [tokenAddress.toLowerCase()]: {
            usd: 28.75,
          },
        },
      });

      const price = await getTokenPrice(tokenAddress);

      expect(price).toBe(28.75);
      expect(mockAxios.get).toHaveBeenCalledTimes(3); // Pyth + DEX + CoinGecko
    });

    it('should return mock price if all oracles fail', async () => {
      const tokenAddress = '0xTOKEN';

      // All fail
      mockAxios.get.mockRejectedValue(new Error('All oracles down'));

      const price = await getTokenPrice(tokenAddress);

      expect(price).toBeGreaterThan(0); // Mock price should be > 0
      expect(price).toBeLessThan(1000); // Reasonable mock range
    });

    it('should cache prices for same block', async () => {
      const tokenAddress = '0xTOKEN';

      mockAxios.get.mockResolvedValue({
        data: { price: 100 },
      });

      // Call twice in quick succession
      const price1 = await getTokenPrice(tokenAddress);
      const price2 = await getTokenPrice(tokenAddress);

      expect(price1).toBe(price2);
      // Should only call API once due to caching
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHistoricalPrice', () => {
    it('should return historical price for given block', async () => {
      const tokenAddress = '0xTOKEN';
      const blockNumber = 1000;

      mockAxios.get.mockResolvedValue({
        data: {
          price: 75.5,
          block: blockNumber,
        },
      });

      const price = await getHistoricalPrice(tokenAddress, blockNumber);

      expect(price).toBe(75.5);
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(blockNumber.toString()),
        expect.any(Object)
      );
    });

    it('should handle missing historical data', async () => {
      const tokenAddress = '0xTOKEN';
      const blockNumber = 1000;

      mockAxios.get.mockRejectedValue(new Error('No historical data'));

      const price = await getHistoricalPrice(tokenAddress, blockNumber);

      // Should return estimated/mock price
      expect(price).toBeGreaterThan(0);
    });
  });

  describe('isLikelyRugPull', () => {
    it('should return true if current price is near zero', async () => {
      const tokenAddress = '0xRUG';

      // Mock current price = $0.0001 (essentially zero)
      mockAxios.get.mockResolvedValue({
        data: { price: 0.0001 },
      });

      const isRug = await isLikelyRugPull(tokenAddress);

      expect(isRug).toBe(true);
    });

    it('should return true if price dropped >99%', async () => {
      const tokenAddress = '0xRUG';

      // Historical price was $100, now $0.50
      mockAxios.get
        .mockResolvedValueOnce({ data: { price: 100 } }) // Historical
        .mockResolvedValueOnce({ data: { price: 0.5 } }); // Current

      const isRug = await isLikelyRugPull(tokenAddress);

      expect(isRug).toBe(true);
    });

    it('should return false for normal price action', async () => {
      const tokenAddress = '0xGOOD';

      // Dropped 30% (normal volatility)
      mockAxios.get
        .mockResolvedValueOnce({ data: { price: 100 } })
        .mockResolvedValueOnce({ data: { price: 70 } });

      const isRug = await isLikelyRugPull(tokenAddress);

      expect(isRug).toBe(false);
    });

    it('should return true if liquidity is removed', async () => {
      const tokenAddress = '0xRUG';

      // Mock LP balance check shows 0 liquidity
      mockAxios.get.mockResolvedValueOnce({
        data: { liquidity: 0 },
      });

      const isRug = await isLikelyRugPull(tokenAddress);

      expect(isRug).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should not throw on network errors', async () => {
      const tokenAddress = '0xTOKEN';

      mockAxios.get.mockRejectedValue(new Error('Network timeout'));

      await expect(getTokenPrice(tokenAddress)).resolves.not.toThrow();
    });

    it('should handle malformed API responses', async () => {
      const tokenAddress = '0xTOKEN';

      mockAxios.get.mockResolvedValue({
        data: null, // Malformed
      });

      const price = await getTokenPrice(tokenAddress);

      expect(price).toBeGreaterThan(0); // Should fallback to mock
    });

    it('should validate price ranges', async () => {
      const tokenAddress = '0xTOKEN';

      // Mock returns impossible negative price
      mockAxios.get.mockResolvedValue({
        data: { price: -100 },
      });

      const price = await getTokenPrice(tokenAddress);

      expect(price).toBeGreaterThanOrEqual(0); // Should sanitize
    });
  });
});
