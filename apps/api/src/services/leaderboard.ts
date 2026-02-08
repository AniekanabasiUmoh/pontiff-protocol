/**
 * Leaderboard Service (Consolidated)
 * Source of Truth for Leaderboard Logic
 */

import { supabase } from '../utils/database';

export type LeaderboardType = 'shame' | 'saints' | 'heretics';
export type GameResultType = 'WIN' | 'LOSS' | 'BETRAYAL';

export class LeaderboardService {

  /**
   * Updates the global leaderboard stats for a player after a game.
   */
  static async updateLeaderboard(wallet_address: string, type: GameResultType, amount: number) {
    if (!wallet_address) return;

    // Find existing entry for this wallet
    // We assume a user has one primary "Status" row.
    // However, the schema allows (wallet, category) unique.
    // But the business logic seems to imply a user transitions:
    // Saint -> (betrays) -> Heretic.
    // So we should probably maintain one active record per user to avoid them being on multiple leaderboards simultaneously?
    // Let's stick to the Web Service logic: One entry per user, changing category.

    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    let entry = existingEntry;

    if (!entry) {
      const { data: newEntry, error: createError } = await supabase
        .from('leaderboard_entries')
        .insert([{
          wallet_address,
          category: 'Sinner', // Default start
          score: 0,
          metadata: { totalWins: 0, totalLoss: 0, totalBetrayals: 0, profit: 0 }
        }])
        .select()
        .single();

      if (createError) {
        console.error("[Leaderboard] Create failed:", createError);
        return;
      }
      entry = newEntry;
    }

    const metadata = (entry.metadata as any) || { totalWins: 0, totalLoss: 0, totalBetrayals: 0, profit: 0 };
    let scoreChange = 0;

    // Update Stats
    if (type === 'WIN') {
      metadata.totalWins = (metadata.totalWins || 0) + 1;
      metadata.profit = (metadata.profit || 0) + amount;
      scoreChange = amount;
    } else if (type === 'LOSS') {
      metadata.totalLoss = (metadata.totalLoss || 0) + 1;
      metadata.profit = (metadata.profit || 0) - amount;
      scoreChange = -amount;
    } else if (type === 'BETRAYAL') {
      metadata.totalBetrayals = (metadata.totalBetrayals || 0) + 1;
      // Betrayal doesn't inherently change score unless we define it
    }

    // Determine Category
    let newCategory = entry.category;
    if (metadata.totalBetrayals > 0) {
      newCategory = 'Heretic';
    } else if (metadata.profit > 0) {
      newCategory = 'Saint';
    } else {
      // Negative profit or zero
      newCategory = 'Sinner'; // or 'Shame' mapping? usage uses 'Sinner' in DB, 'Shame' in API type.
    }

    // Update DB
    const { error: updateError } = await supabase
      .from('leaderboard_entries')
      .update({
        category: newCategory,
        score: entry.score + scoreChange,
        metadata: metadata,
        last_updated: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address);

    if (updateError) {
      console.error("[Leaderboard] Update failed:", updateError);
    }
  }

  /**
   * Returns top players for a specific category.
   */
  static async getLeaderboard(type: LeaderboardType, limit: number = 20) {
    let query = supabase.from('leaderboard_entries').select('*');

    if (type === 'saints') {
      // Saints: Highest Score
      query = query.eq('category', 'Saint').order('score', { ascending: false });
    } else if (type === 'shame') {
      // Shame: Lowest Score (Most negative) OR Category = Sinner
      // We use 'Sinner' category in DB.
      query = query.order('score', { ascending: true }).limit(limit);
      // Note: This might grab Heretics with low scores too. 
      // Refined: Category 'Sinner' OR Just lowest scores globally?
      // "Shame = Biggest Losers".
      query = query.lt('score', 0).order('score', { ascending: true });
    } else if (type === 'heretics') {
      query = query.eq('category', 'Heretic').order('metadata->totalBetrayals', { ascending: false });
    }

    const { data: entries, error } = await query.limit(limit);

    if (error) {
      console.error("[Leaderboard] Fetch failed:", error);
      return { entries: [] };
    }

    // Format for Client
    const formatted = (entries || []).map((e, index) => ({
      rank: index + 1,
      walletAddress: e.wallet_address,
      score: e.score,
      metadata: e.metadata,
    }));

    return { entries: formatted };
  }
}

// Export standalone function to match previous API usage if needed, or refactor consumers
export const getLeaderboard = LeaderboardService.getLeaderboard;
export const updateLeaderboard = LeaderboardService.updateLeaderboard;
