import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Mock the AgentManagerService context
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const SESSION_WALLET = "0x04b4fe48317d87810a6229e945f0dd93d17c85b9";

// Simplified logic from AgentManagerService
async function forceGameLoop() {
    console.log(`--- Forcing Game Loop for ${SESSION_WALLET} ---`);

    // 1. Fetch Session
    const { data: session, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('session_wallet', SESSION_WALLET.toLowerCase())
        .single();

    if (error || !session) {
        console.error('❌ Session not found:', error?.message);
        return;
    }

    console.log(`Session Found: Status=${session.status}, Balance=${session.current_balance}`);

    // 2. Check Balance (skip loop logic, just check what script sees)
    const guiltToken = new ethers.Contract(process.env.NEXT_PUBLIC_GUILT_ADDRESS!, [
        "function balanceOf(address) view returns (uint256)"
    ], provider);
    const balance = await guiltToken.balanceOf(SESSION_WALLET);
    console.log(`On-Chain Balance: ${ethers.formatEther(balance)}`);

    // 3. Simulate Strategy Decision
    console.log('Simulating Strategy Decision...');
    // Hardcode a decision to play RPS
    const action = {
        type: 'GAME',
        game: 'RPS',
        wager: 1, // 1 GUILT
        move: 1, // Rock
        reasoning: "Forced debug move"
    };
    console.log(`Action: Play RPS, Wager 1, Move Rock`);

    // 4. Execute Game (RPS)
    const rpsAddress = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS!;
    const guiltAddress = process.env.NEXT_PUBLIC_GUILT_ADDRESS!;

    console.log(`RPS Contract: ${rpsAddress}`);

    // We can't easily use the Service class here without importing it, 
    // but we can try to instantiate it if we can import the file. I'll import it dynamically.

    try {
        const { AgentManagerService } = await import('../lib/services/agent-manager-service');
        const service = new AgentManagerService();

        console.log('Calling service.executeAgentTurn()...');
        // We need to access private method or just rely on startAgent?
        // startAgent checks if running. 
        // Let's call startAgent, it should log "Starting agent..."

        await service.startAgent(session.id, SESSION_WALLET, session.strategy);
        console.log('✅ startAgent called. Check console for "Agent loop" logs.');

        // Wait a bit to see if loop runs
        await new Promise(r => setTimeout(r, 5000));

    } catch (e: any) {
        console.error('❌ Failed to use service:', e.message);
        console.error(e);
    }
}

forceGameLoop();
