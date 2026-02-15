import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SESSION_WALLET = "0x04b4fe48317d87810a6229e945f0dd93d17c85b9";

const ERC20_ABI = [
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];

async function fixStuckAgent() {
    console.log(`--- Fixing Stuck Agent ${SESSION_WALLET} ---`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const guilt = new ethers.Contract(GUILT_ADDRESS, ERC20_ABI, wallet);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Fund the wallet
    const amount = ethers.parseEther("100");
    console.log(`Funding with 100 GUILT...`);

    try {
        const tx = await guilt.transfer(SESSION_WALLET, amount);
        console.log(`Tx sent: ${tx.hash}`);
        await tx.wait();
        console.log('✅ Funding confirmed.');
    } catch (e: any) {
        console.error('❌ Funding failed:', e.message);
        return;
    }

    // 2. Update DB status to 'active'
    console.log('Updating DB status to active...');
    const { error } = await supabase
        .from('agent_sessions')
        .update({ status: 'active', current_balance: 100 })
        .eq('session_wallet', SESSION_WALLET.toLowerCase());

    if (error) {
        console.error('❌ DB update failed:', error.message);
    } else {
        console.log('✅ DB status updated to ACTIVE.');
    }

    // 3. Restart Agent Loop (via API)
    console.log('Restarting agent loop...');
    // We need the session ID first
    const { data: session } = await supabase
        .from('agent_sessions')
        .select('id, strategy_index')
        .eq('session_wallet', SESSION_WALLET.toLowerCase())
        .single();

    if (session) {
        try {
            await fetch('http://localhost:3000/api/agents/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.id,
                    sessionWallet: SESSION_WALLET,
                    strategy: session.strategy_index || 0
                })
            });
            console.log('✅ Agent restart signal sent.');
        } catch (e: any) {
            console.log('⚠️ Failed to call start API (server might verify signature or be unreachable from script). User can restart from dashboard if needed.');
        }
    }
}

fixStuckAgent();
