import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';


/**
 * GET /api/scan/[wallet]
 * Scans a wallet address and returns comprehensive agent data:
 * - Sin score and redemption status
 * - Conversion history
 * - Game statistics
 * - Tournament participation
 * - Cardinal membership status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const supabase = createServerSupabase();
    const { wallet } = await params;

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Get user/agent data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    // Get conversion history
    const { data: conversions, error: convError } = await supabase
      .from('conversions')
      .select(`
        *,
        competitor_agents (
          handle,
          name,
          threat_level
        )
      `)
      .eq('wallet_address', wallet)
      .order('timestamp', { ascending: false })
      .limit(10);

    // Get game statistics
    const { data: gameStats, error: gameError } = await supabase
      .rpc('get_player_stats', { player_wallet: wallet });

    // Get leaderboard positions
    const { data: leaderboardData } = await supabase
      .from('leaderboard_entries')
      .select('category, score, last_updated')
      .eq('wallet_address', wallet);

    // Get cardinal membership status
    const { data: membership } = await supabase
      .from('cardinal_memberships')
      .select('tier, status, expiry_date, perks')
      .eq('wallet_address', wallet)
      .eq('status', 'active')
      .single();

    // Get confession history
    const { data: confessions } = await supabase
      .from('confessions')
      .select('id, confession_type, stake_amount, sin_reduction, created_at, nft_minted')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get tournament participation
    const { data: tournaments } = await supabase
      .from('tournament_registrations')
      .select(`
        tournament_id,
        final_placement,
        prize_won,
        tournaments (
          name,
          status,
          start_date
        )
      `)
      .eq('wallet_address', wallet)
      .order('registered_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      wallet,
      profile: {
        sinScore: user?.sin_score || 0,
        guiltBalance: user?.guilt_balance || '0',
        totalGames: gameStats?.total_games || 0,
        winRate: gameStats?.win_rate || 0,
        lastActive: user?.last_active,
        createdAt: user?.created_at,
      },
      conversions: conversions || [],
      leaderboard: leaderboardData || [],
      membership: membership || null,
      confessions: confessions || [],
      tournaments: tournaments || [],
      stats: gameStats || {
        total_games: 0,
        games_won: 0,
        games_lost: 0,
        win_rate: 0,
        total_wagered: '0',
        total_won: '0',
      },
    });
  } catch (error: any) {
    console.error('Error scanning wallet:', error);
    return NextResponse.json(
      { error: 'Failed to scan wallet', details: error.message },
      { status: 500 }
    );
  }
}
