/**
 * API Routes for Conversions (Module 11)
 */

import express from 'express';
import {
    trackAllConversions,
    trackConversionsForCompetitor,
    getAllConversions,
    getConversionsForCompetitor,
    getConversionStats,
    announceConversion
} from '../services/conversion-tracking';
import { getCompetitorAgentByHandle } from '../services/agent-detection';
import { twitterClient } from '../services/twitter';

const router = express.Router();

/**
 * GET /api/conversions
 * Get all conversions
 */
router.get('/', async (req, res) => {
    try {
        const conversions = await getAllConversions();
        res.json({
            success: true,
            count: conversions.length,
            conversions
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/conversions/stats
 * Get conversion statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await getConversionStats();
        res.json({
            success: true,
            stats
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/conversions/competitor/:competitor_id
 * Get conversions for specific competitor
 */
router.get('/competitor/:competitor_id', async (req, res) => {
    try {
        const { competitor_id } = req.params;
        const conversions = await getConversionsForCompetitor(competitor_id);

        res.json({
            success: true,
            count: conversions.length,
            conversions
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/conversions/track
 * Manually trigger conversion tracking for all competitors
 */
router.post('/track', async (req, res) => {
    try {
        const conversions = await trackAllConversions(twitterClient || undefined);

        res.json({
            success: true,
            message: `Tracked ${conversions.length} conversions`,
            count: conversions.length,
            conversions
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/conversions/track/:handle
 * Track conversions for specific competitor
 */
router.post('/track/:handle', async (req, res) => {
    try {
        const { handle } = req.params;

        const competitor = await getCompetitorAgentByHandle(handle);
        if (!competitor) {
            return res.status(404).json({
                success: false,
                error: 'Competitor not found'
            });
        }

        const conversions = await trackConversionsForCompetitor(competitor, twitterClient || undefined);

        res.json({
            success: true,
            message: `Tracked ${conversions.length} conversions for ${competitor.name}`,
            count: conversions.length,
            conversions
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/conversions/:id/announce
 * Announce conversion on Twitter
 */
router.post('/:id/announce', async (req, res) => {
    try {
        const { id } = req.params;

        const conversions = await getAllConversions();
        const conversion = conversions.find(c => c.id === id);

        if (!conversion) {
            return res.status(404).json({
                success: false,
                error: 'Conversion not found'
            });
        }

        // Get competitor details
        const { data: competitor } = await require('../utils/database').supabase
            .from('competitor_agents')
            .select('*')
            .eq('id', conversion.competitor_agent_id)
            .single();

        if (!competitor) {
            return res.status(404).json({
                success: false,
                error: 'Competitor not found'
            });
        }

        await announceConversion(conversion, competitor, twitterClient || undefined);

        res.json({
            success: true,
            message: 'Conversion announced'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
