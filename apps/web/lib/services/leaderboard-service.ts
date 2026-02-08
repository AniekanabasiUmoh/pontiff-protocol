import { supabase } from '@/lib/db/supabase';

export type GameResultType = 'WIN' | 'LOSS' | 'BETRAYAL';

export class LeaderboardService {

    /**
     * Updates the global leaderboard stats for a player after a game.
     */
    static async updateLeaderboard(wallet_address: string, type: GameResultType, amount: number) {
        if (!wallet_address) return;

        // Find or create entry
        const { data: existingEntry, error: fetchError } = await supabase
            .from('leaderboard_entries')
            .select('*')
            .eq('wallet_address', wallet_address)
            .single();

        // Supabase returns error PGRST116 for "No rows found"
        let entry = existingEntry;

        if (!entry) {
            const { data: newEntry, error: createError } = await supabase
                .from('leaderboard_entries')
                .insert([{
                    wallet_address,
                    category: 'Sinner', // Default
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
            scoreChange = amount; // Score based on profit
        } else if (type === 'LOSS') {
            metadata.totalLoss = (metadata.totalLoss || 0) + 1;
            metadata.profit = (metadata.profit || 0) - amount;
            scoreChange = -amount; // Negative impact
        } else if (type === 'BETRAYAL') {
            metadata.totalBetrayals = (metadata.totalBetrayals || 0) + 1;
            // Betrayal is a special category
        }

        // Determine Category & Final Score
        // Saints: High Wins/Profit
        // Sinner: High Loss
        // Heretic: High Betrayals

        let newCategory = entry.category;
        if (metadata.totalBetrayals > 0) {
            newCategory = 'Heretic';
        } else if (metadata.profit > 0) {
            newCategory = 'Saint';
        } else {
            newCategory = 'Sinner';
        }

        // Save
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
    static async getLeaderboard(type: 'shame' | 'saints' | 'heretics') {
        let query = supabase.from('leaderboard_entries').select('*');

        if (type === 'saints') {
            query = query.eq('category', 'Saint').order('score', { ascending: false }); // Highest score/profit
        } else if (type === 'shame') {
            // Shame = Biggest Losers (Negative Score or Category Sinner)
            query = query.lt('score', 0).order('score', { ascending: true }); // Most negative first
        } else if (type === 'heretics') {
            query = query.eq('category', 'Heretic').order('last_updated', { ascending: false }); // Most recent
        }

        const { data: entries, error } = await query.limit(20);

        if (error) {
            console.error("[Leaderboard] Fetch failed:", error);
            return [];
        }

        // Format for UI
        return (entries || []).map((e, index) => ({
            rank: index + 1,
            wallet_address: e.wallet_address,
            score: e.score,
            metadata: e.metadata,
        }));
    }
}
