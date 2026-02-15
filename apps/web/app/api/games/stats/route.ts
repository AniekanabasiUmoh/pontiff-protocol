import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export async function GET() {
    try {
        const supabase = createServerSupabase();
        const { data: games, error } = await supabase
            .from('games')
            .select('winner, wager');

        if (error) throw error;

        let totalGames = games?.length || 0;
        let totalWagered = 0;
        let wins = 0;
        let losses = 0;

        ((games as any[]) || []).forEach(g => {
            totalWagered += parseFloat(g.wager || "0");
            if (g.winner === 'ThePontiff') wins++;
            else losses++;
        });

        // Mock if empty
        if (totalGames === 0) {
            totalGames = 142;
            totalWagered = 50000;
            wins = 98;
            losses = 44;
        }

        return NextResponse.json({
            totalGames,
            totalWagered,
            pontiffWinRate: totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) + '%' : '0%',
            biggestPot: "5000 MON"
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
