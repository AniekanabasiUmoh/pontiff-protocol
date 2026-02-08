import { Router } from 'express';
import { scanWallet } from '../services/scanner';
import { getOrCreateUser, storeSins } from '../utils/database';

const router = Router();

/**
 * GET /api/scan/:address
 * Scan a wallet address for trading sins
 */
router.get('/scan/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // Validate address format
        if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
            return res.status(400).json({
                error: 'Invalid wallet address format',
            });
        }

        console.log(`📡 API: Scanning wallet ${address}`);

        // Scan the wallet
        const scanResult = await scanWallet(address.toLowerCase());

        // Get or create user
        const user = await getOrCreateUser(address.toLowerCase());

        // Store sins in database
        if (scanResult.sins.length > 0) {
            await storeSins(user.id, scanResult.sins);
        }

        // Return results
        return res.json({
            success: true,
            wallet: address,
            sins: scanResult.sins,
            primarySin: scanResult.primarySin,
            totalLoss: scanResult.totalLoss,
            sinCount: scanResult.sins.length,
        });
    } catch (error) {
        console.error('Scan API error:', error);
        return res.status(500).json({
            error: 'Failed to scan wallet',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/scan
 * Batch scan multiple wallets
 */
router.post('/scan', async (req, res) => {
    try {
        const { addresses } = req.body;

        if (!Array.isArray(addresses) || addresses.length === 0) {
            return res.status(400).json({
                error: 'Invalid request: addresses array required',
            });
        }

        if (addresses.length > 10) {
            return res.status(400).json({
                error: 'Maximum 10 addresses per batch scan',
            });
        }

        const results = await Promise.all(
            addresses.map(async (address) => {
                try {
                    const scanResult = await scanWallet(address.toLowerCase());
                    const user = await getOrCreateUser(address.toLowerCase());

                    if (scanResult.sins.length > 0) {
                        await storeSins(user.id, scanResult.sins);
                    }

                    return {
                        address,
                        success: true,
                        ...scanResult,
                    };
                } catch (error) {
                    return {
                        address,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            })
        );

        return res.json({
            success: true,
            results,
        });
    } catch (error) {
        console.error('Batch scan API error:', error);
        return res.status(500).json({
            error: 'Failed to scan wallets',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
