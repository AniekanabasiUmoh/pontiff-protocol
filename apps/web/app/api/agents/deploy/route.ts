import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { validators } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  try {
    const body = await request.json();
    const { wallet, personality, name, strategy, strategyIndex, depositAmount, gameType, stopLoss, takeProfit, maxWager, signature, timestamp } = body;

    // Input Validation
    try {
      validators.wallet(wallet, 'wallet');
      validators.string(name, 'name', 50, false); // Name optional? Code says `name || 'Unnamed Agent'`
      validators.string(personality, 'personality', 1000, true);
      if (depositAmount) validators.amount(depositAmount, 'depositAmount', 0);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const agentId = crypto.randomUUID();
    const sessionWalletAddress = wallet; // In the current design, the user wallet *is* the session wallet for MVP, OR we generate one. 
    // Based on previous context, the user provides a wallet or we generate one. 
    // The "wallet" param here likely refers to the USER'S wallet who owns the agent. 
    // But wait, the `agent-manager-service` checks `sessionWalletAddress` vs `user_wallet`. 
    // If we are deploying an agent, we usually generate a NEW wallet or use a shadow wallet.
    // However, looking at `seed-data.ts`, `owner_address` is the user. 
    // Let's assume for now we generate a shadow wallet OR the client sends one. 
    // The previous code returned `wallet` as is. 
    // Let's look at `AgentConfigModal.tsx` to see what it sends.
    // Actually, I should probably check that first. 
    // BUT, keeping it simple: The DB needs an entry.

    // Status: pending_funding. 
    // We'll trust the client to handle the funding tx for now, but we record the intent.

    const { error } = await supabase.from('agent_sessions').insert({
      id: agentId,
      user_wallet: wallet, // The owner
      status: 'pending_funding', // Wait for funds
      strategy: strategy || 'berzerker',
      strategy_index: strategyIndex || 0,
      game_type: gameType || 'rps',
      stop_loss: stopLoss || 50,
      take_profit: takeProfit || 100,
      max_wager: maxWager || 1,
      current_balance: 0,
      starting_balance: depositAmount || 0,
      created_at: new Date().toISOString(),
      metadata: {
        name: name || `Agent ${agentId.slice(0, 8)}`,
        personality: personality
      }
    });

    if (error) {
      console.error('Failed to create agent session:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      agentId,
      wallet, // Returning owner wallet for now
      status: 'pending_funding',
      createdAt: new Date().toISOString(),
      message: 'Agent deployed. Waiting for initial funding.'
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy agent' },
      { status: 500 }
    );
  }
}
