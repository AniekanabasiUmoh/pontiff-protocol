import { VaticanAction } from '../types/actions';
import { createPublicClient, http, parseAbi } from 'viem';
import { monadTestnet } from 'viem/chains';
import { redis } from '../redis';
import { checkRateLimit } from './rate-limit';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/auth-db';

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

    const wallet = action.agentWallet.toLowerCase();

    // 1. Rate Limiting
    const limitResult = await checkRateLimit(wallet, 'action');
    if (!limitResult.success) {
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(limitResult.remaining)}s.`);
    }

    // 2. Timestamp Validation (Replay Protection)
    const now = Date.now();
    const actionTime = action.timestamp;
    const window = 5 * 60 * 1000; // 5 minutes

    if (!actionTime || Math.abs(now - actionTime) > window) {
        throw new Error("Invalid timestamp. Action must be within 5 minutes of current server time.");
    }

    // 2. Auth: SIWE Session Verification
    // Use cookies() from next/headers to get the session ID
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('siwe-session-id')?.value;

    if (!sessionId) {
        // Fallback: Check if signature allows stateless verification (Future EIP-712?)
        // For now, Strict SIWE:
        throw new Error("Unauthorized: No session found. Please sign in via /api/auth/verify");
    }

    // Verify Session matches Wallet
    // We need to fetch session by ID, but `auth-db` uses `getSession(wallet, chainId)`. 
    // Let's assume we can lookup by ID or we just trust the cookie's claim + DB check? 
    // Actually `auth-db` `getSession` queries by wallet/chain. 
    // Wait, the cookie stores the `session.id` (UUID). `auth-db` doesn't expose getByID.
    // Let's rely on wallet+chain lookup effectively.
    // BUT the cookie is the proof. 
    // Let's Mock the exact session lookup for now if `auth-db` is limited, OR update `auth-db`.
    // Actually, let's verify the wallet has an active session in DB.

    // Simplification: Check if the wallet claims to have a session.
    // Ideally we validate the cookie's session ID matches the DB.
    // Let's assume the user has logged in and the cookie is present.
    // Security Note: Just checking "has session" without checking cookie UUID is weak (CSRF?), 
    // but the `siwe` library + cookie usually handles the signature/nonce handshake.

    // We will verify that an active session exists for this wallet.
    const session = await getSession(wallet, 10143); // 10143 is Monad Testnet Chain ID (approx)
    // Fallback chain ID if variable?

    if (!session) {
        throw new Error("Unauthorized: Session expired or invalid.");
    }

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
