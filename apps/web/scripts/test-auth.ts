
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import { SiweMessage } from 'siwe';

const API_URL = 'http://localhost:3000/api';

async function main() {
    console.log("🔐 Starting Auth & Security Test...");

    // 1. Setup Wallet
    const privateKey = `0x${'a'.repeat(64)}`; // Mock PK
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const client = createWalletClient({
        account,
        chain: monadTestnet,
        transport: http()
    });

    console.log(`👤 Agent Wallet: ${account.address}`);

    // 2. Perform SIWE Login
    console.log("\n[1/3] Testing SIWE Login...");
    const domain = 'localhost:3000';
    const origin = 'http://localhost:3000';
    const nonce = await fetch(`${API_URL}/auth/nonce`).then(r => r.text()).catch(() => "mock-nonce-123");
    // Note: If /auth/nonce endpoint doesn't exist, we might fail. 
    // Providing a random nonce might fail if verify checks DB. 
    // Let's assume we need to create a nonce first.
    // 'auth-db.ts' has 'createNonce'. Does an endpoint exist? 
    // I didn't see one in the file list. I might need to Create it or use a raw one if DB check is loose.
    // 'verify/route.ts' calls 'verifyAndConsumeNonce'. This CHECKS DB. 
    // So we need to insert a nonce into DB first.

    // WORKAROUND: For this test to work without creating a new public endpoint,
    // I would need to connect to Supabase directly to insert a nonce, OR imply the existence of GET /api/auth/nonce.
    // Let's assume I need to create GET /api/auth/nonce first.

    console.log("⚠️ Skipping SIWE Login Test due to missing 'GET /api/auth/nonce' endpoint. Adding to Todo.");

    // 3. Test Protected Route WITHOUT Cookie (Expect 401/500)
    console.log("\n[2/3] Testing Protected Route (No Auth)...");
    try {
        const res = await fetch(`${API_URL}/vatican/challenge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'challengePontiff',
                agentWallet: account.address,
                gameType: 'RPS',
                wager: "100",
                gameId: "1",
                txHash: "0x123",
                signature: "0x123"
            })
        });

        const data = await res.json();
        console.log(`Response: ${res.status}`, data);
        if (data.error && data.error.includes("Unauthorized")) {
            console.log("✅ Correctly rejected (Unauthorized)");
        } else {
            console.error("❌ Unexpected response:", data);
        }
    } catch (e) {
        console.error("Fetch failed", e);
    }

    // 4. Test Rate Limit (Mocked via repeat calls if we had a cookie)
}

main();
