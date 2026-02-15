import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

const STRATEGY_MAP: Record<number, string> = {
    0: 'berzerker',
    1: 'merchant',
    2: 'disciple'
};

// POST: Record a new agent session after successful spawn
export async function POST(req: NextRequest) {
    const supabase = createServerSupabase();
    let session: any = null;
    let txHash: string = '';

    try {
        const body = await req.json();

        const {
            txHash: tx,
            fundingTxHash,
            ownerAddress,
            strategy,
            strategyIndex,
            depositAmount,
            stopLoss,
            takeProfit,
            maxWager,
            gameType,
            trashTalk,
            agentMode,
            targetArchetype,
            sessionWalletOverride,
        } = body;

        txHash = tx;

        if (!txHash || !ownerAddress || strategy === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: txHash, ownerAddress, strategy' },
                { status: 400 }
            );
        }

        // Insert session record
        const { data: sessionData, error } = await supabase
            .from('agent_sessions')
            .insert({
                tx_hash: txHash,
                user_wallet: ownerAddress.toLowerCase(),
                strategy: strategy,
                strategy_index: strategyIndex || 0,
                deposit_amount: depositAmount || '0',
                starting_balance: depositAmount || '0',
                current_balance: depositAmount || '0',
                stop_loss: stopLoss || '20',
                take_profit: takeProfit || null,
                max_wager: maxWager || '5',
                game_type: gameType || 'all',
                trash_talk: trashTalk ?? true,
                agent_mode: agentMode || 'PvE',
                target_archetype: targetArchetype || null,
                session_wallet: sessionWalletOverride ? sessionWalletOverride.toLowerCase() : null,
                status: 'active',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            if (error.code === '42P01') {
                return NextResponse.json(
                    { error: 'agent_sessions table not found. Run migration first.' },
                    { status: 500 }
                );
            }
            throw error;
        }

        session = sessionData;

        return NextResponse.json({
            success: true,
            session,
            message: 'Agent session recorded successfully'
        });
    } catch (error: any) {
        console.error('Failed to record session:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to record session' },
            { status: 500 }
        );
    } finally {
        // If we have a session and a wallet (from override or need to fetch), start the agent
        if (session && session.session_wallet) {
            startAgentBackground(session.id, session.session_wallet, session.strategy_index || 0).catch(err => {
                console.error('Background agent start failed:', err);
            });
        } else if (session && txHash) {
            fetchWalletAndStartAgent(session.id, txHash, session.strategy_index || 0).catch(err => {
                console.error('Background wallet fetch failed:', err);
            });
        }
    }
}

async function startAgentBackground(sessionId: string, sessionWallet: string, strategyIndex: number) {
    try {
        const { AgentManagerService } = await import('@/lib/services/agent-manager-service');
        const agentManager = AgentManagerService.getInstance();
        const strategyName = STRATEGY_MAP[strategyIndex] || 'berzerker';
        await agentManager.startAgent(sessionId, sessionWallet, strategyName);
        console.log(`🚀 Agent ${sessionId} started with strategy ${strategyName}`);
    } catch (error: any) {
        console.error(`Background start failed for ${sessionId}:`, error.message);
    }
}

async function fetchWalletAndStartAgent(sessionId: string, txHash: string, strategyIndex: number) {
    try {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const { createPublicClient, http, parseAbi, decodeEventLog } = await import('viem');
        const { monadTestnet } = await import('viem/chains');
        const publicClient = createPublicClient({ chain: monadTestnet, transport: http(process.env.NEXT_PUBLIC_RPC_URL!) });

        const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
        if (!receipt) {
            console.log(`⏳ TX ${txHash} not confirmed yet, will retry via cron`);
            return;
        }

        const FACTORY_ABI = parseAbi([
            "event SessionCreated(address indexed user, address indexed sessionWallet, uint8 strategy, uint256 fee, uint256 timestamp)"
        ]);

        let sessionWallet = null;
        for (const log of receipt.logs) {
            try {
                const decoded = decodeEventLog({ abi: FACTORY_ABI, data: log.data, topics: log.topics });
                if (decoded.eventName === 'SessionCreated') {
                    sessionWallet = (decoded.args as any).sessionWallet;
                    break;
                }
            } catch (e) {
                // Not our event
            }
        }

        if (!sessionWallet) {
            console.log(`⚠️ SessionCreated event not found in ${txHash}`);
            return;
        }

        const supabase = createServerSupabase();
        await supabase
            .from('agent_sessions')
            .update({ session_wallet: sessionWallet.toLowerCase() })
            .eq('id', sessionId);

        await startAgentBackground(sessionId, sessionWallet.toLowerCase(), strategyIndex);
    } catch (error: any) {
        console.error(`Background wallet fetch failed for ${sessionId}:`, error.message);
    }
}

// GET: Get sessions for a wallet address
export async function GET(req: NextRequest) {
    const supabase = createServerSupabase();
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        let query = supabase
            .from('agent_sessions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (address) {
            query = query.eq('user_wallet', address.toLowerCase());
        }

        const { data: sessions, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            sessions: sessions || [],
            count: sessions?.length || 0
        });
    } catch (error: any) {
        console.error('Failed to fetch sessions:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}
