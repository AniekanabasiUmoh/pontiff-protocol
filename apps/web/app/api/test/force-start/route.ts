import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { AgentManagerService } from '@/lib/services/agent-manager-service';


export async function POST() {
    try {
        console.log('🚀 Force-starting ALL active agents...');

        // Get ALL active sessions, even without session_wallet (we'll query blockchain)
        const { data: sessions, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('status', 'active');

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({ message: 'No active agents found', started: [] });
        }

        console.log(`Found ${sessions.length} active sessions`);

        const agentManager = AgentManagerService.getInstance();
        const started = [];
        const failed = [];

        for (const session of sessions) {
            try {
                // If no session_wallet, try to fetch from blockchain first
                let sessionWallet = session.session_wallet;

                if (!sessionWallet && session.tx_hash) {
                    console.log(`Fetching session wallet from blockchain for ${session.id}...`);
                    const { createPublicClient, http, parseAbi, decodeEventLog } = await import('viem');
                    const { monadTestnet } = await import('viem/chains');
                    const publicClient = createPublicClient({ chain: monadTestnet, transport: http(process.env.NEXT_PUBLIC_RPC_URL!) });
                    const receipt = await publicClient.getTransactionReceipt({ hash: session.tx_hash as `0x${string}` });

                    if (receipt) {
                        const FACTORY_ABI = parseAbi(["event SessionCreated(address indexed user, address indexed sessionWallet, uint8 strategy, uint256 fee, uint256 timestamp)"]);

                        for (const log of receipt.logs) {
                            try {
                                const decoded = decodeEventLog({ abi: FACTORY_ABI, data: log.data, topics: log.topics });
                                if (decoded.eventName === 'SessionCreated') {
                                    sessionWallet = (decoded.args as any).sessionWallet.toLowerCase();
                                    // Update DB
                                    await supabase
                                        .from('agent_sessions')
                                        .update({ session_wallet: sessionWallet })
                                        .eq('id', session.id);
                                    console.log(`Updated session wallet: ${sessionWallet}`);
                                    break;
                                }
                            } catch (e) { }
                        }
                    }
                }

                if (!sessionWallet) {
                    failed.push({ id: session.id, reason: 'No session wallet' });
                    continue;
                }

                console.log(`Starting agent ${session.id}...`);
                await agentManager.startAgent(
                    session.id,
                    sessionWallet,
                    session.strategy_index || 0
                );
                started.push(session.id);
                console.log(`✅ Started ${session.id}`);
            } catch (error: any) {
                console.error(`Failed to start ${session.id}:`, error.message);
                failed.push({ id: session.id, reason: error.message });
            }
        }

        return NextResponse.json({
            success: true,
            started,
            failed,
            total: sessions.length
        });
    } catch (error: any) {
        console.error('Force start error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
