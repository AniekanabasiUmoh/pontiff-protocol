import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Record a new agent session after successful spawn
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            txHash,
            ownerAddress,
            strategy,
            strategyIndex,
            depositAmount,
            stopLoss,
            takeProfit,
            maxWager,
            gameType,
            trashTalk
        } = body;

        // Validate required fields
        if (!txHash || !ownerAddress || strategy === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: txHash, ownerAddress, strategy' },
                { status: 400 }
            );
        }

        // Insert session record
        const { data: session, error } = await supabase
            .from('agent_sessions')
            .insert({
                tx_hash: txHash,
                owner_address: ownerAddress.toLowerCase(),
                strategy: strategy,
                strategy_index: strategyIndex || 0,
                deposit_amount: depositAmount || '0',
                stop_loss: stopLoss || '20',
                take_profit: takeProfit || null,
                max_wager: maxWager || '5',
                game_type: gameType || 'all',
                trash_talk: trashTalk ?? true,
                status: 'active',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);

            // If table doesn't exist, create it
            if (error.code === '42P01') {
                return NextResponse.json(
                    { error: 'agent_sessions table not found. Run migration first.' },
                    { status: 500 }
                );
            }

            throw error;
        }

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
    }
}

// GET: Get sessions for a wallet address
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { error: 'Address query parameter required' },
                { status: 400 }
            );
        }

        const { data: sessions, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('owner_address', address.toLowerCase())
            .order('created_at', { ascending: false });

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
