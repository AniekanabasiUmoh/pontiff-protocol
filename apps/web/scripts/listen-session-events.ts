import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { AgentManagerService } from '../lib/services/agent-manager-service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FACTORY_ABI = [
    "event SessionCreated(address indexed user, address indexed sessionWallet, uint8 strategy, uint256 fee, uint256 timestamp)"
];

async function listenForSessionCreated() {
    console.log('🎧 Starting SessionCreated event listener...\n');

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);
    const factoryAddress = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    console.log(`Factory: ${factoryAddress}`);
    console.log(`RPC: ${process.env.NEXT_PUBLIC_RPC_URL}\n`);

    // Monad testnet doesn't support eth_newFilter, so we'll poll blocks instead
    console.log('✅ Using block polling (Monad testnet compatible)\n');

    let lastProcessedBlock = await provider.getBlockNumber();
    console.log(`Starting from block: ${lastProcessedBlock}\n`);

    // Poll for new blocks every 5 seconds
    setInterval(async () => {
        try {
            const currentBlock = await provider.getBlockNumber();

            if (currentBlock > lastProcessedBlock) {
                console.log(`📦 New blocks: ${lastProcessedBlock + 1} to ${currentBlock}`);

                // Query events in the new blocks
                const filter = factory.filters.SessionCreated();
                const events = await factory.queryFilter(filter, lastProcessedBlock + 1, currentBlock);

                for (const event of events) {
                    const args = event.args as any;
                    console.log('\n🎉 SessionCreated Event Detected!');
                    console.log(`   User: ${args.user}`);
                    console.log(`   Session Wallet: ${args.sessionWallet}`);
                    console.log(`   Strategy: ${args.strategy}`);
                    console.log(`   TX Hash: ${event.transactionHash}`);

                    try {
                        // Find the agent session by tx_hash and user_wallet
                        const { data: session, error: findError } = await supabase
                            .from('agent_sessions')
                            .select('*')
                            .eq('tx_hash', event.transactionHash.toLowerCase())
                            .eq('user_wallet', args.user.toLowerCase())
                            .single();

                        if (findError || !session) {
                            console.log(`   ⚠️  No matching session found`);
                            continue;
                        }

                        console.log(`   ✅ Found session: ${session.id}`);

                        // Update with session wallet address
                        const { error: updateError } = await supabase
                            .from('agent_sessions')
                            .update({
                                session_wallet: args.sessionWallet.toLowerCase(),
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', session.id);

                        if (updateError) {
                            console.error(`   ❌ Failed to update:`, updateError);
                        } else {
                            console.log(`   ✅ Session wallet saved!`);

                            // 🚀 AUTOMATICALLY START THE AGENT
                            console.log(`   🤖 Starting agent automatically...`);
                            const agentManager = new AgentManagerService();
                            await agentManager.startAgent(
                                session.id,
                                args.sessionWallet.toLowerCase(),
                                args.strategy
                            );
                            console.log(`   ✅ Agent ${session.id} is now playing games!\n`);
                        }
                    } catch (error) {
                        console.error('   ❌ Error processing event:', error);
                    }
                }

                lastProcessedBlock = currentBlock;
            }
        } catch (error: any) {
            console.error('❌ Polling error:', error.message);
        }
    }, 5000); // Poll every 5 seconds

    console.log('⏰ Polling every 5 seconds for new events...\n');
}

listenForSessionCreated().catch(console.error);
