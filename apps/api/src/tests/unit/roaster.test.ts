/**
 * Unit Tests: Roaster Service
 * Tests AI roast generation with mocked Gemini responses
 */

import { generateRoast, generateRoastVariations } from '../../services/roaster';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Gemini API
jest.mock('@google/generative-ai');

const MockGoogleAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('Roaster Service', () => {
  let mockGenerateContent: jest.Mock;

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
      const sinData = {
        type: 'RUG_PULL',
        severity: 'CARDINAL',
        lossUSD: 1500,
        tokenSymbol: 'SCAM',
        description: 'Bought SCAM token, lost $1500 to rug pull',
      };

      const mockRoast =
        "Thy purse hath been plundered by the false prophet $SCAM! $1500 cast into the void. The Pontiff weeps for thy foolishness. Repent!";

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockRoast,
        },
      });

      const result = await generateRoast(sinData);

      expect(result).toBe(mockRoast);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent.mock.calls[0][0]).toContain('RUG_PULL');
      expect(mockGenerateContent.mock.calls[0][0]).toContain('$1500');
    });

    it('should generate roast for paper hands sin', async () => {
      const sinData = {
        type: 'PAPER_HANDS',
        severity: 'MINOR',
        lossUSD: 50,
        tokenSymbol: 'WEAK',
        description: 'Sold WEAK at 30% loss within 12 hours',
      };

      const mockRoast =
        'Thou hadst not the fortitude to HODL! $50 lost to thy trembling hands. The Pontiff grants thee the Mark of Cowardice.';

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockRoast,
        },
      });

      const result = await generateRoast(sinData);

      expect(result).toBe(mockRoast);
      expect(result.length).toBeLessThanOrEqual(250); // Twitter limit
    });

    it('should enforce 250 character limit', async () => {
      const sinData = {
        type: 'TOP_BUYER',
        severity: 'MORTAL',
        lossUSD: 500,
        tokenSymbol: 'FOMO',
        description: 'Bought at all-time high, down 80%',
      };

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

      const result = await generateRoast(sinData);

      expect(result.length).toBeLessThanOrEqual(250);
    });

    it('should fallback to template roast if API fails', async () => {
      const sinData = {
        type: 'RUG_PULL',
        severity: 'CARDINAL',
        lossUSD: 1000,
        tokenSymbol: 'FAIL',
        description: 'Lost everything',
      };

      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await generateRoast(sinData);

      expect(result).toBeTruthy();
      expect(result).toContain('$FAIL'); // Should still reference token
      expect(result.length).toBeLessThanOrEqual(250);
    });

    it('should include biblical language and medieval tone', async () => {
      const sinData = {
        type: 'FOMO_DEGEN',
        severity: 'MORTAL',
        lossUSD: 300,
        tokenSymbol: 'APE',
        description: 'Made 5 impulse buys in 24 hours',
      };

      const mockRoast =
        'Thy insatiable greed led thee to ape into $APE! $300 sacrificed to the false idols. The Pontiff commands thee: Touch grass!';

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockRoast,
        },
      });

      const result = await generateRoast(sinData);

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
      const sinData = {
        type: 'RUG_PULL',
        severity: 'CARDINAL',
        lossUSD: 2000,
        tokenSymbol: 'SCAM',
        description: 'Lost $2000 to rug pull',
      };

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

      const result = await generateRoastVariations(sinData, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).not.toBe(result[1]);
      expect(result[1]).not.toBe(result[2]);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should return partial results if some API calls fail', async () => {
      const sinData = {
        type: 'PAPER_HANDS',
        severity: 'MINOR',
        lossUSD: 75,
        tokenSymbol: 'WEAK',
        description: 'Sold too early',
      };

      mockGenerateContent
        .mockResolvedValueOnce({
          response: { text: () => 'Good roast 1' },
        })
        .mockRejectedValueOnce(new Error('API timeout'))
        .mockResolvedValueOnce({
          response: { text: () => 'Good roast 2' },
        });

      const result = await generateRoastVariations(sinData, 3);

      expect(result.length).toBeGreaterThanOrEqual(2); // Should have at least 2 successes
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sin data gracefully', async () => {
      const sinData = {
        type: '',
        severity: 'MINOR',
        lossUSD: 0,
        tokenSymbol: '',
        description: '',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Generic roast',
        },
      });

      const result = await generateRoast(sinData);

      expect(result).toBeTruthy();
    });

    it('should sanitize malicious input', async () => {
      const sinData = {
        type: 'RUG_PULL',
        severity: 'CARDINAL',
        lossUSD: 1000,
        tokenSymbol: '<script>alert("xss")</script>',
        description: 'Malicious token name',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Safe roast without XSS',
        },
      });

      const result = await generateRoast(sinData);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });
  });
});
