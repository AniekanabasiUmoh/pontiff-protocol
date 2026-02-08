/**
 * API Routes for Debates (Module 10)
 */

import express from 'express';
import {
    initiateDebate,
    continueDebate,
    endDebate,
    getAllDebates,
    getDebateById,
    getDebateExchanges,
    getActiveDebatesForCompetitor
} from '../services/debate';
import { getCompetitorAgentByHandle } from '../services/agent-detection';
import { twitterClient } from '../services/twitter';

const router = express.Router();

/**
 * GET /api/debates
 * Get all debates
 */
router.get('/', async (req, res) => {
    try {
        const debates = await getAllDebates();
        res.json({
            success: true,
            count: debates.length,
            debates
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/debates/:id
 * Get specific debate with exchanges
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const debate = await getDebateById(id);

        if (!debate) {
            return res.status(404).json({
                success: false,
                error: 'Debate not found'
            });
        }

        const exchanges = await getDebateExchanges(id);

        res.json({
            success: true,
            debate,
            exchanges
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/debates/initiate
 * Initiate debate with a competitor
 */
router.post('/initiate', async (req, res) => {
    try {
        const { competitor_handle, their_tweet_id, their_tweet_text } = req.body;

        if (!competitor_handle) {
            return res.status(400).json({
                success: false,
                error: 'competitor_handle is required'
            });
        }

        const competitor = await getCompetitorAgentByHandle(competitor_handle);
        if (!competitor) {
            return res.status(404).json({
                success: false,
                error: 'Competitor not found'
            });
        }

        const theirTweet = their_tweet_id && their_tweet_text
            ? { id: their_tweet_id, text: their_tweet_text }
            : undefined;

        const debate = await initiateDebate(competitor, twitterClient || undefined, theirTweet);

        if (!debate) {
            return res.status(500).json({
                success: false,
                error: 'Failed to initiate debate'
            });
        }

        res.json({
            success: true,
            message: 'Debate initiated',
            debate
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/debates/:id/continue
 * Continue existing debate
 */
router.post('/:id/continue', async (req, res) => {
    try {
        const { id } = req.params;
        const { their_argument, their_tweet_id, competitor_handle } = req.body;

        if (!their_argument || !their_tweet_id || !competitor_handle) {
            return res.status(400).json({
                success: false,
                error: 'their_argument, their_tweet_id, and competitor_handle are required'
            });
        }

        const debate = await getDebateById(id);
        if (!debate) {
            return res.status(404).json({
                success: false,
                error: 'Debate not found'
            });
        }

        const competitor = await getCompetitorAgentByHandle(competitor_handle);
        if (!competitor) {
            return res.status(404).json({
                success: false,
                error: 'Competitor not found'
            });
        }

        const updatedDebate = await continueDebate(
            debate,
            competitor,
            their_argument,
            their_tweet_id,
            twitterClient || undefined
        );

        if (!updatedDebate) {
            return res.status(500).json({
                success: false,
                error: 'Failed to continue debate'
            });
        }

        res.json({
            success: true,
            message: 'Debate continued',
            debate: updatedDebate
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/debates/:id/end
 * End debate
 */
router.post('/:id/end', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (!status || !['won', 'lost', 'abandoned'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Valid status is required (won, lost, abandoned)'
            });
        }

        await endDebate(id, status, reason);

        res.json({
            success: true,
            message: `Debate ended: ${status}`
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/debates/competitor/:competitor_id
 * Get active debates for a competitor
 */
router.get('/competitor/:competitor_id', async (req, res) => {
    try {
        const { competitor_id } = req.params;
        const debates = await getActiveDebatesForCompetitor(competitor_id);

        res.json({
            success: true,
            count: debates.length,
            debates
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
