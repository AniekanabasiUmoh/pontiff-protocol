/**
 * Unit Tests: Roaster Service
 * Tests AI roast generation with mocked Gemini responses
 */

import { generateRoast, generateRoastVariations } from '../../services/roaster';
import { Sin, SinType, SinSeverity } from '../../services/scanner';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Gemini API
jest.mock('@google/generative-ai');

const MockGoogleAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('Roaster Service', () => {
  let mockGenerateContent: jest.Mock;

  // Test data factory
  const createTestSin = (overrides: Partial<Sin> = {}): Sin => ({
    wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    sin_type: SinType.RUG_PULL,
    severity: SinSeverity.CARDINAL,
    token_address: '0xSCAM',
    token_symbol: 'SCAM',
    loss_amount_usd: 1500,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Gemini mock
    mockGenerateContent = jest.fn();

    MockGoogleAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }) as any);
  });

  describe('generateRoast', () => {
    it('should generate roast for rug pull sin', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [createTestSin()];
      const primarySin = SinType.RUG_PULL;
      const totalLoss = 1500;

      const mockRoast =
        "Thy purse hath been plundered by the false prophet $SCAM! $1500 cast into the void. The Pontiff weeps for thy foolishness. Repent!";

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockRoast,
        },
      });

      const result = await generateRoast(walletAddress, sins, primarySin, totalLoss);

      expect(result).toBe(mockRoast);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should generate roast for paper hands sin', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [createTestSin({
        sin_type: SinType.PAPER_HANDS,
        severity: SinSeverity.MINOR,
        token_symbol: 'WEAK',
        loss_amount_usd: 50,
      })];
      const primarySin = SinType.PAPER_HANDS;
      const totalLoss = 50;

      const mockRoast =
        'Thou hadst not the fortitude to HODL! $50 lost to thy trembling hands. The Pontiff grants thee the Mark of Cowardice.';

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockRoast,
        },
      });

      const result = await generateRoast(walletAddress, sins, primarySin, totalLoss);

      expect(result).toBe(mockRoast);
      expect(result.length).toBeLessThanOrEqual(250); // Twitter limit
    });

    it('should enforce 250 character limit', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [createTestSin({
        sin_type: SinType.TOP_BUYER,
        severity: SinSeverity.MORTAL,
        token_symbol: 'FOMO',
        loss_amount_usd: 500,
      })];
      const primarySin = SinType.TOP_BUYER;
      const totalLoss = 500;

      const longRoast =
        'A' +
        'A very long roast that exceeds the Twitter character limit and needs to be truncated so it fits properly'.repeat(
          10
        );

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => longRoast,
        },
      });

      const result = await generateRoast(walletAddress, sins, primarySin, totalLoss);

      expect(result.length).toBeLessThanOrEqual(250);
    });

    it('should fallback to template roast if API fails', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [createTestSin({
        token_symbol: 'FAIL',
        loss_amount_usd: 1000,
      })];
      const primarySin = SinType.RUG_PULL;
      const totalLoss = 1000;

      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await generateRoast(walletAddress, sins, primarySin, totalLoss);

      expect(result).toBeTruthy();
      expect(result.length).toBeLessThanOrEqual(250);
    });

    it('should include biblical language and medieval tone', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [createTestSin({
        sin_type: SinType.FOMO_DEGEN,
        severity: SinSeverity.MORTAL,
        token_symbol: 'APE',
        loss_amount_usd: 300,
      })];
      const primarySin = SinType.FOMO_DEGEN;
      const totalLoss = 300;

      const mockRoast =
        'Thy insatiable greed led thee to ape into $APE! $300 sacrificed to the false idols. The Pontiff commands thee: Touch grass!';

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockRoast,
        },
      });

      const result = await generateRoast(walletAddress, sins, primarySin, totalLoss);

      // Check for medieval/biblical language markers
      const hasArchaicLanguage =
        result.includes('thee') ||
        result.includes('thy') ||
        result.includes('thou') ||
        result.includes('hath') ||
        result.includes('Pontiff');

      expect(hasArchaicLanguage).toBe(true);
    });
  });

  describe('generateRoastVariations', () => {
    it('should generate 3 distinct roast variations', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [createTestSin({ loss_amount_usd: 2000 })];
      const primarySin = SinType.RUG_PULL;
      const totalLoss = 2000;

      const mockRoasts = [
        'Variation 1: Thy $2000 vanished like smoke! The Pontiff judges thee harshly.',
        'Variation 2: The false prophet $SCAM hath robbed thee blind! Repent!',
        'Variation 3: $2000 cast into the abyss! Thy portfolio weeps.',
      ];

      mockGenerateContent
        .mockResolvedValueOnce({
          response: { text: () => mockRoasts[0] },
        })
        .mockResolvedValueOnce({
          response: { text: () => mockRoasts[1] },
        })
        .mockResolvedValueOnce({
          response: { text: () => mockRoasts[2] },
        });

      const result = await generateRoastVariations(walletAddress, sins, primarySin, totalLoss, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).not.toBe(result[1]);
      expect(result[1]).not.toBe(result[2]);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should return partial results if some API calls fail', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [createTestSin({
        sin_type: SinType.PAPER_HANDS,
        severity: SinSeverity.MINOR,
        token_symbol: 'WEAK',
        loss_amount_usd: 75,
      })];
      const primarySin = SinType.PAPER_HANDS;
      const totalLoss = 75;

      mockGenerateContent
        .mockResolvedValueOnce({
          response: { text: () => 'Good roast 1' },
        })
        .mockRejectedValueOnce(new Error('API timeout'))
        .mockResolvedValueOnce({
          response: { text: () => 'Good roast 2' },
        });

      const result = await generateRoastVariations(walletAddress, sins, primarySin, totalLoss, 3);

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sins gracefully', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [];
      const primarySin = SinType.FOMO_DEGEN;
      const totalLoss = 0;

      // Should return clean wallet roast (no API call needed)
      const result = await generateRoast(walletAddress, sins, primarySin, totalLoss);

      expect(result).toBeTruthy();
    });

    it('should sanitize malicious input', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const sins: Sin[] = [createTestSin({
        token_symbol: '<script>alert("xss")</script>',
      })];
      const primarySin = SinType.RUG_PULL;
      const totalLoss = 1000;

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Safe roast without XSS',
        },
      });

      const result = await generateRoast(walletAddress, sins, primarySin, totalLoss);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });
  });
});
