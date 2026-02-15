import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';



// GET: Global leaderboard (combined PvE + PvP)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || 'earnings'; // earnings, wins, elo

    // Initialize Supabase within the request handler
    const supabase = await createServerSupabase();

    try {
        let orderBy = 'profit_loss';

        // Map category to column and order
        if (category === 'wins' || category === 'saints') orderBy = 'total_wins';
        else if (category === 'elo' || category === 'heretics') orderBy = 'elo_rating';
        else if (category === 'shame') orderBy = 'total_losses';
        else orderBy = 'profit_loss'; // Default to earnings

        // Get top agents from agent_sessions
        const { data: agents, error } = await supabase
            .from('agent_sessions')
            .select(`
                id,
                user_wallet,
                strategy,
                profit_loss,
                pvp_earnings,
                total_wins,
                total_losses,
                elo_rating,
                agent_mode,
                status,
                created_at
            `)
            .order(orderBy, { ascending: false })
            .limit(limit) as { data: any[], error: any };

        if (error) throw error;

        // Calculate rank and format
        const leaderboard = agents?.map((agent, index) => {
            const profit = parseFloat(agent.profit_loss || '0');
            const created = new Date(agent.created_at);
            const daysStaked = !isNaN(created.getTime())
                ? Math.floor((new Date().getTime() - created.getTime()) / (1000 * 3600 * 24))
                : 0;

            return {
                rank: index + 1,
                walletAddress: agent.user_wallet || '',
                score: category === 'shame' ? agent.total_losses : (category === 'saints' ? agent.total_wins : agent.elo_rating),
                metadata: {
                    totalLoss: Math.abs(profit < 0 ? profit : 0), // Only show loss if negative? Or just use value? Frontend text says "Total Lost". Let's use absolute value.
                    loyaltyScore: agent.total_wins * 10, // Mock scoring
                    failedCoupCount: agent.total_losses,
                    stakeDays: daysStaked
                }
            };
        }) || [];

        return NextResponse.json({
            success: true,
            entries: leaderboard,
            category,
            count: leaderboard.length
        });
    } catch (error: any) {
        console.error('Failed to fetch leaderboard:', error);

        // If columns don't exist, return empty leaderboard
        if (error.code === '42703' || error.message?.includes('does not exist')) {
            return NextResponse.json({
                success: true,
                entries: [],
                category,
                count: 0,
                message: 'Leaderboard schema incomplete'
            });
        }

        return NextResponse.json(
            { error: error.message || 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
