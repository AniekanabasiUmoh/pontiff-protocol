import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';


export async function GET(request: Request) {
    const url = new URL(request.url);
    const txHash = url.searchParams.get('tx');

    if (!txHash) {
        return NextResponse.json({ error: 'Missing tx parameter' }, { status: 400 });
    }

    try {
        // 1. Check if session exists
        const { data: session, error: sessionError } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('tx_hash', txHash.toLowerCase())
            .single();

        if (sessionError) {
            return NextResponse.json({
                step: 'session_lookup',
                status: 'FAILED',
                error: sessionError.message,
                hint: 'Session not found in database. Spawn may have failed.'
            });
        }

        // 2. Check if session_wallet is set
        const walletConfirmed = !!session.session_wallet;

        // 3. Check if game_history table exists
        const { error: tableError } = await supabase
            .from('game_history')
            .select('id')
            .limit(1);

        const gameHistoryExists = !tableError || !tableError.message?.includes('does not exist');

        // 4. Check if any games played
        let gamesCount = 0;
        if (gameHistoryExists) {
            const { count } = await supabase
                .from('game_history')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', session.id);
            gamesCount = count || 0;
        }

        // Build diagnostic report
        const diagnostics = {
            session_found: true,
            session_id: session.id,
            session_wallet: session.session_wallet || 'NOT SET ❌',
            wallet_confirmed: walletConfirmed,
            status: session.status,
            strategy: session.strategy,
            deposit: session.deposit_amount,
            games_played: session.games_played || 0,
            game_history_table_exists: gameHistoryExists,
            game_history_count: gamesCount,

            // Diagnostics
            issues: [] as string[],
            next_steps: [] as string[]
        };

        // Identify issues
        if (!walletConfirmed) {
            diagnostics.issues.push('❌ Session wallet not confirmed yet (blockchain event pending)');
            diagnostics.next_steps.push('Wait 30-60 seconds for blockchain confirmation');
        }

        if (!gameHistoryExists) {
            diagnostics.issues.push('❌ game_history table does not exist');
            diagnostics.next_steps.push('Run SQL migration: CREATE_GAME_HISTORY.sql');
        }

        if (walletConfirmed && gameHistoryExists && gamesCount === 0) {
            diagnostics.issues.push('⚠️ Agent should be playing but no games recorded');
            diagnostics.next_steps.push('Check if agent was started via /api/agents/auto-start');
            diagnostics.next_steps.push('Check server logs for errors');
        }

        if (diagnostics.issues.length === 0) {
            diagnostics.issues.push('✅ All systems look good!');
            if (gamesCount > 0) {
                diagnostics.next_steps.push('Games are being played! Refresh dashboard.');
            } else {
                diagnostics.next_steps.push('Agent should start playing within 60 seconds.');
            }
        }

        return NextResponse.json(diagnostics, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            step: 'unknown',
            status: 'ERROR',
            error: error.message
        }, { status: 500 });
    }
}
