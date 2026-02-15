import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';


/**
 * POST /api/treasury/distribute
 * Distributes accumulated treasury revenue to:
 * - Cardinal members (revenue sharing)
 * - GUILT token stakers
 * - Development fund
 *
 * This should be called via CRON or admin action
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication/authorization check
    // Only allow CRON jobs or admin wallet to call this

    // Get undistributed revenue
    const { data: undistributed, error: revenueError } = await supabase
      .from('treasury_revenue')
      .select('*')
      .eq('distributed', false);

    if (revenueError) {
      throw new Error(`Failed to fetch revenue: ${revenueError.message}`);
    }

    if (!undistributed || undistributed.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No revenue to distribute',
        amount: '0',
      });
    }

    // Calculate total revenue
    const totalRevenue = undistributed.reduce((sum, entry) => {
      return sum + BigInt(entry.amount);
    }, BigInt(0));

    // Distribution percentages
    const CARDINAL_SHARE = 0.40; // 40% to cardinals
    const STAKER_SHARE = 0.40;   // 40% to stakers
    const DEV_FUND = 0.20;        // 20% to dev fund

    const cardinalAmount = (totalRevenue * BigInt(40)) / BigInt(100);
    const stakerAmount = (totalRevenue * BigInt(40)) / BigInt(100);
    const devAmount = (totalRevenue * BigInt(20)) / BigInt(100);

    // Get all active cardinal members
    const { data: cardinals, error: cardinalError } = await supabase
      .from('cardinal_memberships')
      .select('wallet_address, tier, perks')
      .eq('status', 'active');

    if (cardinalError) {
      throw new Error(`Failed to fetch cardinals: ${cardinalError.message}`);
    }

    // Calculate per-cardinal share (simplified - equal distribution)
    const cardinalsCount = cardinals?.length || 0;
    const perCardinalShare = cardinalsCount > 0
      ? cardinalAmount / BigInt(cardinalsCount)
      : BigInt(0);

    // TODO: Implement actual on-chain distribution
    // For now, record the distribution intent

    const distributionRecord = {
      total_amount: totalRevenue.toString(),
      staking_amount: stakerAmount.toString(),
      cardinal_amount: cardinalAmount.toString(),
      dev_fund_amount: devAmount.toString(),
      cardinals_count: cardinalsCount,
      per_cardinal_share: perCardinalShare.toString(),
      distribution_date: new Date().toISOString(),
      status: 'pending', // 'pending', 'completed', 'failed'
      metadata: {
        revenue_sources: undistributed.map(r => r.source),
        transaction_count: undistributed.length,
      },
    };

    // Insert distribution record
    const { data: distribution, error: distError } = await supabase
      .from('revenue_distributions')
      .insert(distributionRecord)
      .select()
      .single();

    if (distError) {
      throw new Error(`Failed to create distribution: ${distError.message}`);
    }

    // Mark revenue as distributed
    const revenueIds = undistributed.map(r => r.id);
    const { error: updateError } = await supabase
      .from('treasury_revenue')
      .update({
        distributed: true,
        distributed_at: new Date().toISOString(),
      })
      .in('id', revenueIds);

    if (updateError) {
      throw new Error(`Failed to update revenue status: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Revenue distribution initiated',
      distribution: {
        id: distribution.id,
        totalAmount: totalRevenue.toString(),
        cardinalAmount: cardinalAmount.toString(),
        stakerAmount: stakerAmount.toString(),
        devAmount: devAmount.toString(),
        cardinalsCount,
        perCardinalShare: perCardinalShare.toString(),
        status: 'pending',
      },
      revenueSourcesProcessed: undistributed.length,
    });
  } catch (error: any) {
    console.error('Error distributing revenue:', error);
    return NextResponse.json(
      { error: 'Failed to distribute revenue', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/treasury/distribute
 * Get distribution history
 */
export async function GET(request: NextRequest) {
  try {
    const { data: distributions, error } = await supabase
      .from('revenue_distributions')
      .select('*')
      .order('distribution_date', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch distributions: ${error.message}`);
    }

    // Get current undistributed revenue
    const { data: undistributed } = await supabase
      .from('treasury_revenue')
      .select('amount')
      .eq('distributed', false);

    const pendingAmount = undistributed?.reduce((sum, entry) => {
      return sum + BigInt(entry.amount);
    }, BigInt(0)) || BigInt(0);

    return NextResponse.json({
      success: true,
      distributions: distributions || [],
      pendingRevenue: pendingAmount.toString(),
    });
  } catch (error: any) {
    console.error('Error fetching distributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch distributions', details: error.message },
      { status: 500 }
    );
  }
}
