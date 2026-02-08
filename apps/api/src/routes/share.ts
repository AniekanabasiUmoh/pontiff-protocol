import express from 'express';
import { queueTweet } from '../services/queue';
import { supabase } from '../utils/database';

const router = express.Router();

// POST /api/share/:confessionId
// Manually trigger a share/tweet for a confession
router.post('/:confessionId', async (req, res) => {
    const { confessionId } = req.params;

    try {
        // 1. Fetch confession details
        const { data: confession, error } = await supabase
            .from('confessions')
            .select('*')
            .eq('id', confessionId)
            .single();

        if (error || !confession) {
            return res.status(404).json({ success: false, error: 'Confession not found' });
        }

        // 2. Queue the tweet
        await queueTweet({
            confessionId: confession.id,
            roast: confession.roast_text || confession.roast, // Handle naming variation
            walletAddress: confession.wallet_address || confession.wallet // Handle naming variation
        });

        return res.json({
            success: true,
            message: 'Confession queued for sharing on X',
            tweet_text_preview: `Fail... ${confession.wallet_address}...`
        });

    } catch (error) {
        console.error('Share error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
