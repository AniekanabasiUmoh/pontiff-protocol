/**
 * Leaderboard Routes
 * Handles Hall of Shame, Hall of Saints, Hall of Heretics
 */

import { Router } from 'express';
import { calculateLeaderboards, getLeaderboard, LeaderboardType } from '../services/leaderboard';
import { strictRateLimiter } from '../middleware/security';

const router = Router();

/**
 * GET /api/leaderboard/:type
 * Returns leaderboard data for specified type
 * Types: shame (biggest losers), saints (most loyal), heretics (failed betrayers)
 */
router.get('/:type', strictRateLimiter, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Validate type
    const validTypes: LeaderboardType[] = ['shame', 'saints', 'heretics'];
    if (!validTypes.includes(type as LeaderboardType)) {
      return res.status(400).json({
        error: 'Invalid leaderboard type',
        message: `Type must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Get leaderboard data
    const leaderboard = await getLeaderboard(
      type as LeaderboardType,
      Number(limit),
      Number(offset)
    );

    return res.json({
      type,
      limit: Number(limit),
      offset: Number(offset),
      total: leaderboard.total,
      entries: leaderboard.entries,
      lastUpdated: leaderboard.lastUpdated,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/leaderboard/recalculate
 * Manually trigger leaderboard recalculation
 * Admin only endpoint
 */
router.post('/recalculate', strictRateLimiter, async (req, res) => {
  try {
    // Check for admin authorization
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || !authHeader || authHeader !== `Bearer ${adminKey}`) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Admin authentication required',
      });
    }

    await calculateLeaderboards();

    return res.json({
      message: 'Leaderboards recalculated successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Leaderboard recalculation error:', error);
    return res.status(500).json({
      error: 'Failed to recalculate leaderboards',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/leaderboard/user/:address
 * Get user's position across all leaderboards
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
      });
    }

    // Get user's rankings from all leaderboards
    const [shame, saints, heretics] = await Promise.all([
      getUserRankFromLeaderboard('shame', address),
      getUserRankFromLeaderboard('saints', address),
      getUserRankFromLeaderboard('heretics', address),
    ]);

    return res.json({
      address,
      rankings: {
        shame,
        saints,
        heretics,
      },
    });
  } catch (error) {
    console.error('User ranking fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch user rankings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Helper: Get user's rank from specific leaderboard
 */
async function getUserRankFromLeaderboard(
  type: LeaderboardType,
  address: string
): Promise<{ rank: number | null; score: number; percentile: number }> {
  // Get full leaderboard
  const leaderboard = await getLeaderboard(type, 1000, 0);

  // Find user's entry
  const userEntry = leaderboard.entries.find(
    e => e.walletAddress.toLowerCase() === address.toLowerCase()
  );

  if (!userEntry) {
    return {
      rank: null,
      score: 0,
      percentile: 0,
    };
  }

  // Calculate percentile
  const percentile = leaderboard.total > 0
    ? Math.round((1 - (userEntry.rank - 1) / leaderboard.total) * 100)
    : 0;

  return {
    rank: userEntry.rank,
    score: userEntry.score,
    percentile,
  };
}

export default router;
