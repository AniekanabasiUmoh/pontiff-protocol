/**
 * Analytics API - Game Statistics
 * GET /api/analytics/games
 *
 * Provides game statistics and metrics
 */

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const gameType = searchParams.get('type') || 'all'; // all, RPS, POKER, JUDAS
        const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, all

        // Calculate date range
        let startDate = new Date();
        if (period === '1d') {
            startDate.setDate(startDate.getDate() - 1);
        } else if (period === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else {
            startDate = new Date(0); // All time
        }

        // Build query
        let query = supabase
            .from('game_history')
            .select('*')
            .gte('created_at', startDate.toISOString());

        if (gameType !== 'all') {
            query = query.eq('game_type', gameType.toUpperCase());
        }

        const { data: games, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch game data' },
                { status: 500 }
            );
        }

        // Calculate statistics
        const totalGames = games?.length || 0;
        const wins = games?.filter(g => g.result === 'win').length || 0;
        const losses = games?.filter(g => g.result === 'loss').length || 0;
        const draws = games?.filter(g => g.result === 'draw').length || 0;

        const totalWagered = games?.reduce((sum, g) => sum + parseFloat(g.wager || '0'), 0) || 0;
        const totalPayout = games?.reduce((sum, g) => sum + parseFloat(g.payout || '0'), 0) || 0;

        // Calculate house edge
        const houseRevenue = totalWagered - totalPayout;
        const houseEdge = totalWagered > 0 ? ((houseRevenue / totalWagered) * 100).toFixed(2) : 0;

        // Game type breakdown
        const byType = {
            RPS: games?.filter(g => g.game_type === 'RPS').length || 0,
            POKER: games?.filter(g => g.game_type === 'POKER').length || 0,
            JUDAS: games?.filter(g => g.game_type === 'JUDAS').length || 0
        };

        // Top players
        const playerStats = games?.reduce((acc: any, game) => {
            const player = game.player_address;
            if (!acc[player]) {
                acc[player] = { wins: 0, losses: 0, draws: 0, wagered: 0, payout: 0 };
            }
            if (game.result === 'win') acc[player].wins++;
            if (game.result === 'loss') acc[player].losses++;
            if (game.result === 'draw') acc[player].draws++;
            acc[player].wagered += parseFloat(game.wager || '0');
            acc[player].payout += parseFloat(game.payout || '0');
            return acc;
        }, {});

        const topPlayers = Object.entries(playerStats || {})
            .map(([address, stats]: [string, any]) => ({
                address,
                ...stats,
                profit: stats.payout - stats.wagered,
                winRate: ((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100).toFixed(2)
            }))
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 10);

        return NextResponse.json({
            period,
            gameType,
            summary: {
                totalGames,
                wins,
                losses,
                draws,
                winRate: totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0
            },
            financial: {
                totalWagered: totalWagered.toFixed(2),
                totalPayout: totalPayout.toFixed(2),
                houseRevenue: houseRevenue.toFixed(2),
                houseEdge: `${houseEdge}%`
            },
            byType,
            topPlayers
        });

    } catch (error: any) {
        console.error('[API] Game analytics error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch game analytics' },
            { status: 500 }
        );
    }
}
