import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Fix env loading - use absolute path from CWD
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FACTORY_ABI = [
    "event SessionCreated(address indexed user, address indexed sessionWallet, uint8 strategy, uint256 fee, uint256 timestamp)"
];

async function fixSessionWallet(manualTxHash?: string) {
    console.log('🔧 Manual Session Wallet Fix\n');

    let txHash = manualTxHash;
    let sessionId: string | null = null;
    let strategyIndex = 0;

    // If no TX provided, find latest session with missing wallet
    if (!txHash) {
        const { data: sessions, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .is('session_wallet', null)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error || !sessions || sessions.length === 0) {
            console.log('✅ No broken sessions found! All agents have wallets.');
            return;
        }

        const session = sessions[0];
        console.log('Found session with null session_wallet:');
        console.log(`   ID: ${session.id}`);
        console.log(`   User: ${session.user_wallet}`);
        console.log(`   TX Hash: ${session.tx_hash}\n`);

        txHash = session.tx_hash;
        sessionId = session.id;
        strategyIndex = session.strategy_index || 0;
    } else {
        // Lookup session by TX
        const { data: session } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('tx_hash', txHash.toLowerCase())
            .single();

        if (session) {
            sessionId = session.id;
            strategyIndex = session.strategy_index || 0;
        }
    }

    if (!txHash) {
        console.error('❌ No TX hash available to query.');
        return;
    }

    console.log('Querying SessionWalletFactory contract...');

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
        console.error('❌ Transaction not found on chain yet.');
        return;
    }

    const factoryAddress = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    // Parse logs for SessionCreated event
    let sessionWallet = null;
    for (const log of receipt.logs) {
        try {
            const parsed = factory.interface.parseLog({
                topics: log.topics as string[],
                data: log.data
            });

            if (parsed?.name === 'SessionCreated') {
                sessionWallet = parsed.args.sessionWallet;
                console.log(`✅ Found SessionCreated event: ${sessionWallet}`);
                break;
            }
        } catch (e) {
            // Not our event
        }
    }

    if (!sessionWallet) {
        console.error('❌ SessionCreated event not found in transaction logs.');
        return;
    }

    if (sessionId) {
        console.log(`Updating session ${sessionId}...`);
        const { error: updateError } = await supabase
            .from('agent_sessions')
            .update({
                session_wallet: sessionWallet.toLowerCase(),
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        if (updateError) {
            console.error('❌ Failed to update DB:', updateError);
            return;
        }
        console.log(`✅ Session wallet updated successfully!\n`);

        // Check for game_history table
        const { error: historyError } = await supabase
            .from('game_history')
            .select('id')
            .limit(1);

        if (historyError && historyError.code === '42P01') { // undefined_table
            console.warn('⚠️ WARNING: game_history table seems to be missing!');
            console.warn('   Run CREATE_GAME_HISTORY.sql in Supabase SQL Editor.');
        }

        console.log(`🤖 Starting agent...`);

        try {
            // Dynamic import to avoid load issues if envs missing initially
            const { AgentManagerService } = await import('../lib/services/agent-manager-service');
            const agentManager = new AgentManagerService();
            await agentManager.startAgent(
                sessionId,
                sessionWallet.toLowerCase(),
                strategyIndex
            );
            console.log(`✅ Agent started! Check dashboard.`);
        } catch (e: any) {
            console.error(`❌ Failed to start agent: ${e.message}`);
        }
    } else {
        console.log(`⚠️ Session ID not found in DB for this TX. Cannot update.`);
    }
}

const manualTx = process.argv[2];
fixSessionWallet(manualTx).catch(console.error);
