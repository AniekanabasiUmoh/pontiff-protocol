import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cardinal/renew
 * Subscribe or Renew Cardinal Membership
 * Body: { wallet: string, txHash: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { wallet, txHash } = body;

    if (!wallet || !txHash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: wallet, txHash' },
        { status: 400 }
      );
    }

    // Verify transaction on-chain (skipped for MVP, trust client for now or implement verification)
    // In production: verify txHash transferred 1000 GUILT to treasury

    // Check if existing member
    const { data: existingMember } = await supabase
      .from('cardinal_members')
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    let expiresAt: Date;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    if (existingMember) {
      // Extend existing expiry if active, or start fresh if expired
      const currentExpiry = new Date(existingMember.expires_at);
      const now = new Date();

      if (currentExpiry > now) {
        // Extend
        expiresAt = new Date(currentExpiry.getTime() + THIRTY_DAYS_MS);
      } else {
        // Restart
        expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);
      }
    } else {
      // New member
      expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
    }

    // Upsert record
    const { error } = await supabase
      .from('cardinal_members')
      .upsert({
        wallet_address: wallet,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        last_renewed_at: new Date().toISOString(),
        tier: 'cardinal'
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      wallet,
      status: 'active',
      expiresAt: expiresAt.toISOString(),
      message: 'Membership updated successfully'
    });

  } catch (error: any) {
    console.error('Cardinal Renew Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
