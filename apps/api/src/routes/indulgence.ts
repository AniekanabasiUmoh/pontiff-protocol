import { Router } from 'express';
import { ethers } from 'ethers';
import { generateCertificateImage, validateImageData } from '../services/imageGenerator';

const router = Router();

// Contract ABI for Indulgence (only the functions we need)
const INDULGENCE_ABI = [
    'function getSinInfo(uint256 tokenId) external view returns (uint256 sinId, uint8 severity, bool revoked, address owner)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
];

// Severity enum mapping
enum SinSeverity {
    MINOR = 0,
    MORTAL = 1,
    CARDINAL = 2,
    UNFORGIVABLE = 3,
}

const SEVERITY_NAMES = ['Minor', 'Mortal', 'Cardinal', 'Unforgivable'];
const SEVERITY_DESCRIPTIONS = {
    Minor: 'A small transgression in the eyes of The Pontiff',
    Mortal: 'A serious sin requiring divine intervention',
    Cardinal: 'A grave offense against the sacred laws of trading',
    Unforgivable: 'A heinous act that stains the eternal soul',
};

/**
 * GET /api/metadata/indulgence/:tokenId
 * Returns NFT metadata for an Indulgence token
 * Follows OpenSea metadata standards
 */
router.get('/metadata/indulgence/:tokenId', async (req, res) => {
    try {
        const { tokenId } = req.params;

        // Validate token ID
        if (!tokenId || isNaN(Number(tokenId))) {
            return res.status(400).json({
                error: 'Invalid token ID',
            });
        }

        // Get contract address from env
        const indulgenceAddress = process.env.INDULGENCE_CONTRACT_ADDRESS;
        if (!indulgenceAddress) {
            return res.status(500).json({
                error: 'Indulgence contract address not configured',
            });
        }

        // Connect to contract
        const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz');
        const contract = new ethers.Contract(indulgenceAddress, INDULGENCE_ABI, provider);

        // Fetch token info from contract
        let sinInfo;
        try {
            sinInfo = await contract.getSinInfo(tokenId);
        } catch (error) {
            return res.status(404).json({
                error: 'Token not found',
                message: 'This Indulgence does not exist',
            });
        }

        const [sinId, severity, revoked, owner] = sinInfo;
        const severityName = SEVERITY_NAMES[Number(severity)];
        const isRevoked = Boolean(revoked);

        // Generate certificate image URL
        const certificateUrl = `${process.env.API_BASE_URL || 'https://api.pontiff.xyz'}/certificate/${tokenId}`;

        // Build metadata object
        const metadata = {
            name: isRevoked
                ? `EXCOMMUNICATED - Indulgence #${tokenId}`
                : `Indulgence of ${severityName} Sin #${tokenId}`,
            description: isRevoked
                ? `This absolution has been REVOKED by The Pontiff. The bearer stands EXCOMMUNICATED from the faith for violating the sacred covenant.`
                : `A sacred certificate of absolution granted by The Pontiff for a ${severityName.toLowerCase()} sin. The bearer has confessed, paid penance, and received divine forgiveness. This indulgence is soulbound and cannot be transferred.`,
            image: certificateUrl,
            external_url: `${process.env.WEB_BASE_URL || 'https://pontiff.xyz'}/indulgence/${tokenId}`,
            attributes: [
                {
                    trait_type: 'Sin Severity',
                    value: severityName,
                },
                {
                    trait_type: 'Status',
                    value: isRevoked ? 'EXCOMMUNICATED' : 'Absolved',
                },
                {
                    trait_type: 'Sin ID',
                    value: sinId.toString(),
                },
                {
                    trait_type: 'Owner',
                    value: owner,
                },
                {
                    display_type: 'date',
                    trait_type: 'Granted',
                    value: Math.floor(Date.now() / 1000), // Approximate - would need event logs for exact
                },
            ],
            properties: {
                category: 'Soulbound Token',
                creator: 'The Pontiff',
                severity: severityName,
                revoked: isRevoked,
                sinId: sinId.toString(),
                owner: owner,
            },
        };

        // Set cache headers (1 hour for active, 24h for revoked)
        const cacheTime = isRevoked ? 86400 : 3600;
        res.set('Cache-Control', `public, max-age=${cacheTime}`);

        return res.json(metadata);
    } catch (error) {
        console.error('Metadata API error:', error);
        return res.status(500).json({
            error: 'Failed to generate metadata',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/certificate/:tokenId
 * Generates and returns the absolution certificate image
 */
router.get('/certificate/:tokenId', async (req, res) => {
    try {
        const { tokenId } = req.params;

        // Validate token ID
        if (!tokenId || isNaN(Number(tokenId))) {
            return res.status(400).json({
                error: 'Invalid token ID',
            });
        }

        // Get contract address from env
        const indulgenceAddress = process.env.INDULGENCE_CONTRACT_ADDRESS;
        if (!indulgenceAddress) {
            return res.status(500).json({
                error: 'Indulgence contract address not configured',
            });
        }

        // Connect to contract
        const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz');
        const contract = new ethers.Contract(indulgenceAddress, INDULGENCE_ABI, provider);

        // Fetch token info from contract
        let sinInfo;
        try {
            sinInfo = await contract.getSinInfo(tokenId);
        } catch (error) {
            return res.status(404).json({
                error: 'Token not found',
                message: 'This Indulgence does not exist',
            });
        }

        const [sinId, severity, revoked, owner] = sinInfo;
        const severityName = SEVERITY_NAMES[Number(severity)];
        const isRevoked = Boolean(revoked);

        // Generate certificate image
        const imageData = await generateCertificateImage(
            tokenId,
            String(owner),
            severityName,
            isRevoked
        );

        if (!validateImageData(imageData)) {
            throw new Error('Generated invalid image data');
        }

        // Extract the base64 data and send as SVG
        const base64Data = imageData.split(',')[1];
        const svgBuffer = Buffer.from(base64Data, 'base64');

        // Set appropriate headers
        res.set('Content-Type', 'image/svg+xml');
        res.set('Cache-Control', isRevoked ? 'public, max-age=86400' : 'public, max-age=3600');
        res.send(svgBuffer);
    } catch (error) {
        console.error('Certificate generation error:', error);
        return res.status(500).json({
            error: 'Failed to generate certificate',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
