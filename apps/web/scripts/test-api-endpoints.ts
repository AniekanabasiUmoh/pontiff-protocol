// import fetch from 'node-fetch'; // Native fetch in Node 18+

const WEB_URL = 'http://localhost:3000/api';
const API_URL = 'http://localhost:3001/api';
const AGENT_WALLET = '0x1234567890123456789012345678901234567890';

// --- Phase 1: Vatican ---
async function testConfess() {
    console.log('\n--- 1. Testing Confession API (Web:3000) ---');
    try {
        const res = await fetch(`${WEB_URL}/vatican/confess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentWallet: AGENT_WALLET,
                timestamp: Date.now()
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        if (res.status === 200) console.log('✅ Success');
        else console.log('❌ Failed:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

// --- Phase 2: Gaming ---
async function testRPS() {
    console.log('\n--- 2. Testing RPS Create API (Web:3000) ---');
    try {
        const res = await fetch(`${WEB_URL}/games/rps/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                opponent: '0xPONTIFF_AI',
                wager: '100',
                playerAddress: AGENT_WALLET
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('❌ Error (Web server might be down or endpoint missing):', error.message);
    }
}

// --- Phase 3: Warfare (Backend API) ---
async function testScan() {
    console.log('\n--- 3. Testing Competitor Scan (API:3001) ---');
    try {
        const res = await fetch(`${API_URL}/competitors/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('⚠️ Note: Ensure apps/api is running on port 3001');
        console.error('❌ Error:', error.message);
    }
}

async function main() {
    await testConfess();
    await testRPS();
    await testScan();
}

main();
