import { VaticanAction } from '../types/actions';
import { createPublicClient, http, parseAbi } from 'viem';
import { monadTestnet } from 'viem/chains';
import { redis } from '../redis';
import { checkRateLimit } from './rate-limit';
import { validators } from '../utils/validation';
import { verifyWalletSignature } from '../auth/verify-signature';

const VATICAN_ENTRY_ABI = parseAbi([
    'function isInVatican(address agent) external view returns (bool)'
]);

const client = createPublicClient({
    chain: monadTestnet,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
});

const VATICAN_ENTRY_ADDRESS = process.env.NEXT_PUBLIC_VATICAN_ENTRY_ADDRESS as `0x${string}`;

export async function validateAction(action: VaticanAction) {
    if (process.env.MOCK_VALIDATION === 'true') {
        console.log("⚠️ Mocking Validation for", action.agentWallet);
        return true;
    }

    // 0. Input Validation
    if (!action || typeof action !== 'object') {
        throw new Error('Invalid request body');
    }

    // Normalize and validate wallet
    let wallet = action.agentWallet;

    // Handle actions that might use different wallet fields if any (fallback)
    if (!wallet && 'walletAddress' in action) wallet = (action as any).walletAddress;
    if (!wallet && 'sessionWallet' in action) wallet = (action as any).sessionWallet;

    if (!wallet) throw new Error('Missing wallet address');

    try {
        wallet = validators.wallet(wallet, 'walletAddress');
    } catch (e: any) {
        throw new Error(e.message);
    }

    // Validate Timestamp
    if (!action.timestamp || typeof action.timestamp !== 'number') {
        throw new Error('Invalid or missing timestamp');
    }

    // 1. Rate Limiting
    const limitResult = await checkRateLimit(wallet, 'action');
    if (!limitResult.success) {
        const waitSeconds = limitResult.resetTime
            ? Math.ceil((limitResult.resetTime - Date.now()) / 1000)
            : 60;
        throw new Error(`Rate limit exceeded. Try again in ${waitSeconds}s.`);
    }

    // 2. Cryptographic Signature Verification
    // Expected Message: "Pontiff Action: {type} at {timestamp}"
    // Double check specific action structures if they deviate
    const message = `Pontiff Action: ${action.type} at ${action.timestamp}`;
    const { verifyWalletSignature } = await import('../auth/verify-signature');

    // Allow skipping signature if explicitly using a SECRET (e.g. Cron)
    // But Cron usually doesn't call this middleware, it uses its own auth.

    const isValid = await verifyWalletSignature(message, action.signature, wallet);
    if (!isValid) {
        throw new Error("Invalid wallet signature or expired timestamp.");
    }

    // 3. Vatican Entry (Cached)

    // 3. Vatican Entry (Cached)
    const cacheKey = `vatican:entry:${wallet}`;
    let hasEntered = await redis?.get(cacheKey);

    if (hasEntered === 'true') {
        // Cached Pass
    } else {
        // RPC Call
        try {
            const result = await client.readContract({
                address: VATICAN_ENTRY_ADDRESS,
                abi: VATICAN_ENTRY_ABI,
                functionName: 'isInVatican',
                args: [wallet as `0x${string}`]
            });

            hasEntered = result ? 'true' : 'false';

            // Cache result (5 mins for true, 1 min for false to allow retries)
            const ttl = result ? 300 : 60;
            await redis?.set(cacheKey, hasEntered, 'EX', ttl);

        } catch (error) {
            console.error("Vatican Entry Check Failed:", error);
            // Fail open or closed? Closed for security.
            throw new Error("Failed to verify Vatican Entry status on-chain.");
        }
    }

    if (hasEntered !== 'true') {
        throw new Error("Agent has not entered the Vatican. Pay the toll first.");
    }

    return true;
}
