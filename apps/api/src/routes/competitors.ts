/**
 * API Routes for Competitor Agents (Module 9)
 */

import express from 'express';
import {
    scanForCompetitorAgents,
    getAllCompetitorAgents,
    getCompetitorAgentByHandle,
    updateCompetitorMetrics
} from '../services/agent-detection';
import { readOnlyClient as twitterClient } from '../services/twitter';

const router = express.Router();

/**
 * GET /api/competitors
 * Get all competitor agents
 */
router.get('/', async (req, res) => {
    try {
        const agents = await getAllCompetitorAgents();
        res.json({
            success: true,
            count: agents.length,
            agents
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitors/:handle
 * Get specific competitor by Twitter handle
 */
router.get('/:handle', async (req, res) => {
    try {
        const { handle } = req.params;
        const agent = await getCompetitorAgentByHandle(handle);

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Competitor not found'
            });
        }

        res.json({
            success: true,
            agent
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitors/scan
 * Manually trigger agent scan
 */
router.post('/scan', async (req, res) => {
    try {
        const agents = await scanForCompetitorAgents(twitterClient || undefined);

        res.json({
            success: true,
            message: `Scan complete. Found ${agents.length} agents.`,
            count: agents.length,
            agents
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/competitors/:id/metrics
 * Update competitor metrics
 */
router.put('/:id/metrics', async (req, res) => {
    try {
        const { id } = req.params;
        const { market_cap, holders, treasury_balance } = req.body;

        await updateCompetitorMetrics(id, {
            market_cap,
            holders,
            treasury_balance
        });

        res.json({
            success: true,
            message: 'Metrics updated'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
