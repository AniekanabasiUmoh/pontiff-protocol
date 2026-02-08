import { Router } from 'express';
import { scanWallet } from '../services/scanner';
import { generateRoast, generateRoastVariations } from '../services/roaster';
import { generateWritImage, validateImageData, getImageExtension } from '../services/imageGenerator';
import { uploadWritImage } from '../services/storage';
import { getOrCreateUser, storeSins, storeConfession } from '../utils/database';

const router = Router();

/**
 * POST /api/confess
 * Scan wallet, generate roast, and store confession
 * 
 * This is the main endpoint that ties everything together:
 * Scanner → Roaster → Database → Response
 */
router.post('/confess', async (req, res) => {
    try {
        const { walletAddress } = req.body;

        // Validate address format
        if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            return res.status(400).json({
                error: 'Invalid wallet address format',
            });
        }

        console.log(`⛪ Confession request for ${walletAddress}`);

        // Step 1: Scan the wallet for sins
        console.log('🔍 Scanning for sins...');
        const scanResult = await scanWallet(walletAddress.toLowerCase());

        // Step 2: Generate the roast
        console.log('🔥 Generating roast...');
        const roast = await generateRoast(
            walletAddress,
            scanResult.sins,
            scanResult.primarySin,
            scanResult.totalLoss
        );

        // Step 3: Store in database (get confession ID first)
        console.log('💾 Storing confession...');
        const user = await getOrCreateUser(walletAddress.toLowerCase());

        // Store sins
        if (scanResult.sins.length > 0) {
            await storeSins(user.id, scanResult.sins);
        }

        // Store confession with roast (but no image URL yet)
        const confession = await storeConfession(
            user.id,
            walletAddress.toLowerCase(),
            roast
        );

        // Step 4: Generate Writ image
        console.log('🎨 Generating Writ image...');
        let writImageUrl: string | null = null;

        try {
            const imageData = await generateWritImage(
                roast,
                walletAddress,
                confession.id
            );

            if (validateImageData(imageData)) {
                const extension = getImageExtension(imageData);
                writImageUrl = await uploadWritImage(imageData, confession.id, extension);
                console.log('✅ Writ image uploaded:', writImageUrl);
            }
        } catch (imageError) {
            console.error('❌ Image generation failed (non-critical):', imageError);
            // Continue without image - it's not critical for MVP
        }

        console.log('✅ Confession complete');

        // Return the confession
        return res.json({
            success: true,
            confession: {
                id: confession.id,
                wallet: walletAddress,
                roast: roast,
                writImageUrl: writImageUrl, // May be null if image generation failed
                sins: scanResult.sins,
                primarySin: scanResult.primarySin,
                totalLoss: scanResult.totalLoss,
                sinCount: scanResult.sins.length,
                severity: getSeverityLabel(scanResult.sins),
                createdAt: confession.created_at,
            },
        });
    } catch (error) {
        console.error('Confession API error:', error);
        return res.status(500).json({
            error: 'Failed to process confession',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/roast/preview
 * Generate multiple roast variations without saving
 * Useful for testing and A/B testing
 */
router.post('/roast/preview', async (req, res) => {
    try {
        const { walletAddress, count = 3 } = req.body;

        if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            return res.status(400).json({
                error: 'Invalid wallet address format',
            });
        }

        // Scan wallet
        const scanResult = await scanWallet(walletAddress.toLowerCase());

        // Generate multiple variations
        const roasts = await generateRoastVariations(
            walletAddress,
            scanResult.sins,
            scanResult.primarySin,
            scanResult.totalLoss,
            Math.min(count, 5) // Max 5 variations
        );

        return res.json({
            success: true,
            wallet: walletAddress,
            roasts: roasts,
            scanSummary: {
                sins: scanResult.sins.length,
                totalLoss: scanResult.totalLoss,
                primarySin: scanResult.primarySin,
            },
        });
    } catch (error) {
        console.error('Roast preview error:', error);
        return res.status(500).json({
            error: 'Failed to generate roast preview',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/confession/:id
 * Retrieve a specific confession by ID
 */
router.get('/confession/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // This would query Supabase for the confession
        // For now, return a placeholder
        return res.json({
            message: 'Confession retrieval - implementation pending',
            id,
        });
    } catch (error) {
        console.error('Get confession error:', error);
        return res.status(500).json({
            error: 'Failed to retrieve confession',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Helper: Get severity label from sins
 */
function getSeverityLabel(sins: any[]): string {
    if (sins.length === 0) return 'None';

    const severities = sins.map(s => s.severity);

    if (severities.includes('unforgivable')) return 'Unforgivable';
    if (severities.includes('cardinal')) return 'Cardinal';
    if (severities.includes('mortal')) return 'Mortal';
    return 'Minor';
}

export default router;
