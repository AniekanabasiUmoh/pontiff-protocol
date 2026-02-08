/**
 * Integration Tests: Full Confession Flow
 * Tests end-to-end confession process: scan → roast → image → DB
 */

import request from 'supertest';
import { app } from '../../index';
import { scanWallet } from '../../services/scanner';
import { generateRoast } from '../../services/roaster';
import { generateWritImage } from '../../services/imageGenerator';
import { storeConfession } from '../../utils/database';

// Mock all services
jest.mock('../../services/scanner');
jest.mock('../../services/roaster');
jest.mock('../../services/imageGenerator');
jest.mock('../../utils/database');

const mockScanWallet = scanWallet as jest.MockedFunction<typeof scanWallet>;
const mockGenerateRoast = generateRoast as jest.MockedFunction<typeof generateRoast>;
const mockGenerateWritImage = generateWritImage as jest.MockedFunction<typeof generateWritImage>;
const mockStoreConfession = storeConfession as jest.MockedFunction<typeof storeConfession>;

describe('Confession Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/confess', () => {
    it('should complete full confession flow successfully', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      // Mock scanner
      mockScanWallet.mockResolvedValue({
        sins: [
          {
            type: 'RUG_PULL',
            severity: 'CARDINAL',
            lossUSD: 1500,
            tokenSymbol: 'SCAM',
            tokenAddress: '0xSCAM',
            description: 'Lost $1500 to rug pull',
            timestamp: Date.now(),
          },
        ],
        primarySin: 'RUG_PULL',
        totalLossUSD: 1500,
      });

      // Mock roaster
      mockGenerateRoast.mockResolvedValue(
        'Thy purse hath been plundered by $SCAM! The Pontiff weeps for thy $1500.'
      );

      // Mock image generator
      mockGenerateWritImage.mockResolvedValue('data:image/svg+xml;base64,PHN2Zz4=');

      // Mock database
      mockStoreConfession.mockResolvedValue({
        confessionId: 'conf_123',
        writImageUrl: 'https://storage.example.com/writ_123.svg',
      });

      const response = await request(app)
        .post('/api/confess')
        .send({ walletAddress: testWallet })
        .expect(200);

      expect(response.body).toMatchObject({
        confessionId: 'conf_123',
        roast: expect.any(String),
        writImageUrl: expect.any(String),
        sins: expect.arrayContaining([
          expect.objectContaining({
            type: 'RUG_PULL',
            severity: 'CARDINAL',
          }),
        ]),
      });

      // Verify all steps were called
      expect(mockScanWallet).toHaveBeenCalledWith(testWallet);
      expect(mockGenerateRoast).toHaveBeenCalled();
      expect(mockGenerateWritImage).toHaveBeenCalled();
      expect(mockStoreConfession).toHaveBeenCalled();
    });

    it('should return 400 for invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/confess')
        .send({ walletAddress: 'invalid_address' })
        .expect(400);

      expect(response.body.error).toContain('Invalid wallet address');
    });

    it('should return 404 if wallet has no sins', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockScanWallet.mockResolvedValue({
        sins: [],
        primarySin: null,
        totalLossUSD: 0,
      });

      const response = await request(app)
        .post('/api/confess')
        .send({ walletAddress: testWallet })
        .expect(404);

      expect(response.body.error).toContain('No sins found');
    });

    it('should handle scanner failures gracefully', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockScanWallet.mockRejectedValue(new Error('RPC timeout'));

      const response = await request(app)
        .post('/api/confess')
        .send({ walletAddress: testWallet })
        .expect(500);

      expect(response.body.error).toContain('Failed to scan wallet');
    });

    it('should fallback to template roast if AI fails', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockScanWallet.mockResolvedValue({
        sins: [
          {
            type: 'PAPER_HANDS',
            severity: 'MINOR',
            lossUSD: 50,
            tokenSymbol: 'WEAK',
            tokenAddress: '0xWEAK',
            description: 'Sold too early',
            timestamp: Date.now(),
          },
        ],
        primarySin: 'PAPER_HANDS',
        totalLossUSD: 50,
      });

      // AI fails
      mockGenerateRoast.mockRejectedValue(new Error('Gemini API timeout'));

      // Image gen still works
      mockGenerateWritImage.mockResolvedValue('data:image/svg+xml;base64,PHN2Zz4=');
      mockStoreConfession.mockResolvedValue({
        confessionId: 'conf_456',
        writImageUrl: 'https://storage.example.com/writ_456.svg',
      });

      const response = await request(app)
        .post('/api/confess')
        .send({ walletAddress: testWallet })
        .expect(200);

      expect(response.body.roast).toBeTruthy(); // Should have fallback roast
      expect(response.body.confessionId).toBe('conf_456');
    });

    it('should rate limit excessive requests', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockScanWallet.mockResolvedValue({
        sins: [],
        primarySin: null,
        totalLossUSD: 0,
      });

      // Send 10 requests rapidly
      const promises = Array(10)
        .fill(null)
        .map(() => request(app).post('/api/confess').send({ walletAddress: testWallet }));

      const responses = await Promise.all(promises);

      // At least one should be rate limited (429)
      const rateLimited = responses.some((r) => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('POST /api/roast/preview', () => {
    it('should generate multiple roast variations', async () => {
      const sinData = {
        type: 'RUG_PULL',
        severity: 'CARDINAL',
        lossUSD: 1000,
        tokenSymbol: 'SCAM',
        description: 'Lost everything',
      };

      mockGenerateRoast
        .mockResolvedValueOnce('Roast variation 1')
        .mockResolvedValueOnce('Roast variation 2')
        .mockResolvedValueOnce('Roast variation 3');

      const response = await request(app)
        .post('/api/roast/preview')
        .send({ sinData, count: 3 })
        .expect(200);

      expect(response.body.roasts).toHaveLength(3);
      expect(response.body.roasts[0]).not.toBe(response.body.roasts[1]);
    });
  });

  describe('GET /api/scan/:address', () => {
    it('should return sin analysis for wallet', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockScanWallet.mockResolvedValue({
        sins: [
          {
            type: 'TOP_BUYER',
            severity: 'MORTAL',
            lossUSD: 500,
            tokenSymbol: 'FOMO',
            tokenAddress: '0xFOMO',
            description: 'Bought at ATH',
            timestamp: Date.now(),
          },
        ],
        primarySin: 'TOP_BUYER',
        totalLossUSD: 500,
      });

      const response = await request(app).get(`/api/scan/${testWallet}`).expect(200);

      expect(response.body).toMatchObject({
        sins: expect.any(Array),
        primarySin: 'TOP_BUYER',
        totalLossUSD: 500,
      });
    });

    it('should cache scan results for same wallet', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockScanWallet.mockResolvedValue({
        sins: [],
        primarySin: null,
        totalLossUSD: 0,
      });

      // Call twice
      await request(app).get(`/api/scan/${testWallet}`).expect(200);
      await request(app).get(`/api/scan/${testWallet}`).expect(200);

      // Should only scan once due to caching
      expect(mockScanWallet).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed image generation', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      mockScanWallet.mockResolvedValue({
        sins: [{ type: 'RUG_PULL', severity: 'MINOR', lossUSD: 50 } as any],
        primarySin: 'RUG_PULL',
        totalLossUSD: 50,
      });

      mockGenerateRoast.mockResolvedValue('Test roast');

      // Fail twice, succeed on third attempt
      mockGenerateWritImage
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce('data:image/svg+xml;base64,PHN2Zz4=');

      mockStoreConfession.mockResolvedValue({
        confessionId: 'conf_retry',
        writImageUrl: 'https://storage.example.com/writ_retry.svg',
      });

      const response = await request(app)
        .post('/api/confess')
        .send({ walletAddress: testWallet })
        .expect(200);

      expect(response.body.confessionId).toBe('conf_retry');
      expect(mockGenerateWritImage).toHaveBeenCalledTimes(3); // Retried
    });
  });
});
