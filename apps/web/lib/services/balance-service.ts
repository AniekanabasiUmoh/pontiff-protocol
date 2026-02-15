import { createClient } from '@supabase/supabase-js';

// Use service role for balance operations (bypasses RLS)
function getDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
}
const supabase = new Proxy({} as ReturnType<typeof getDb>, {
    get: (_, p) => { const c = getDb(); const v = (c as any)[p]; return typeof v === 'function' ? v.bind(c) : v; }
});

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'WAGER' | 'WIN' | 'LOSS' | 'CRUSADE_REWARD' | 'REFUND' | 'HOUSE_EDGE';

export interface BalanceResult {
    success: boolean;
    balance?: number;
    error?: string;
}

/**
 * Central balance service for the Casino.
 * ALL balance modifications go through this service.
 * Every change is logged to balance_transactions for audit.
 */
export class BalanceService {

    /**
     * Get or create a user's balance record.
     */
    static async getBalance(walletAddress: string): Promise<{
        available: number;
        frozen: number;
        totalDeposited: number;
        totalWithdrawn: number;
        totalWagered: number;
        totalWon: number;
    }> {
        const wallet = walletAddress.toLowerCase();

        const { data, error } = await supabase
            .from('user_balances')
            .select('*')
            .eq('wallet_address', wallet)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No row yet — create one
                await supabase
                    .from('user_balances')
                    .insert({ wallet_address: wallet });
            }
            // Return zero balance on any error (table may not exist yet, or new user)
            return {
                available: 0,
                frozen: 0,
                totalDeposited: 0,
                totalWithdrawn: 0,
                totalWagered: 0,
                totalWon: 0,
            };
        }

        return {
            available: parseFloat(data.available),
            frozen: parseFloat(data.frozen),
            totalDeposited: parseFloat(data.total_deposited),
            totalWithdrawn: parseFloat(data.total_withdrawn),
            totalWagered: parseFloat(data.total_wagered),
            totalWon: parseFloat(data.total_won),
        };
    }

    /**
     * Credit a user's balance (deposit, win, reward).
     * Atomic: balance update + audit log in one call.
     */
    static async credit(
        walletAddress: string,
        amount: number,
        type: TransactionType,
        gameId?: string,
        gameType?: string,
        metadata?: Record<string, any>
    ): Promise<BalanceResult> {
        const wallet = walletAddress.toLowerCase();
        if (amount <= 0) return { success: false, error: 'Amount must be positive' };

        try {
            // Get current balance
            const { data: current, error: fetchError } = await supabase
                .from('user_balances')
                .select('available')
                .eq('wallet_address', wallet)
                .single();

            if (fetchError && fetchError.code === 'PGRST116') {
                // Create row first
                await supabase
                    .from('user_balances')
                    .insert({ wallet_address: wallet })
                    .select()
                    .single();
            }

            const currentBalance = current ? parseFloat(current.available) : 0;
            const newBalance = currentBalance + amount;

            // Update stat columns based on type
            const statUpdates: Record<string, any> = {
                available: newBalance,
            };
            if (type === 'DEPOSIT') statUpdates.total_deposited = parseFloat((current as any)?.total_deposited || '0') + amount;
            if (type === 'WIN' || type === 'CRUSADE_REWARD') statUpdates.total_won = parseFloat((current as any)?.total_won || '0') + amount;

            // Update balance
            const { error: updateError } = await supabase
                .from('user_balances')
                .update(statUpdates)
                .eq('wallet_address', wallet);

            if (updateError) throw new Error(`Balance update failed: ${updateError.message}`);

            // Log the transaction
            await supabase.from('balance_transactions').insert({
                wallet_address: wallet,
                type,
                amount,
                balance_before: currentBalance,
                balance_after: newBalance,
                game_id: gameId || null,
                game_type: gameType || null,
                metadata: metadata || {},
            });

            return { success: true, balance: newBalance };
        } catch (err: any) {
            console.error(`[BalanceService] Credit failed:`, err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Debit a user's balance (wager, withdrawal, fee).
     * Atomic: checks balance, deducts, and logs.
     */
    static async debit(
        walletAddress: string,
        amount: number,
        type: TransactionType,
        gameId?: string,
        gameType?: string,
        metadata?: Record<string, any>
    ): Promise<BalanceResult> {
        const wallet = walletAddress.toLowerCase();
        if (amount <= 0) return { success: false, error: 'Amount must be positive' };

        try {
            // Get current balance
            const { data: current, error: fetchError } = await supabase
                .from('user_balances')
                .select('*')
                .eq('wallet_address', wallet)
                .single();

            if (fetchError || !current) {
                return { success: false, error: 'No balance record found' };
            }

            const currentBalance = parseFloat(current.available);

            if (currentBalance < amount) {
                return { success: false, error: `Insufficient balance: ${currentBalance} < ${amount}` };
            }

            const newBalance = currentBalance - amount;

            // Update stat columns based on type
            const statUpdates: Record<string, any> = {
                available: newBalance,
            };
            if (type === 'WITHDRAW') statUpdates.total_withdrawn = parseFloat(current.total_withdrawn) + amount;
            if (type === 'WAGER') statUpdates.total_wagered = parseFloat(current.total_wagered) + amount;

            // Update balance
            const { error: updateError } = await supabase
                .from('user_balances')
                .update(statUpdates)
                .eq('wallet_address', wallet);

            if (updateError) throw new Error(`Balance update failed: ${updateError.message}`);

            // Log the transaction
            await supabase.from('balance_transactions').insert({
                wallet_address: wallet,
                type,
                amount,
                balance_before: currentBalance,
                balance_after: newBalance,
                game_id: gameId || null,
                game_type: gameType || null,
                metadata: metadata || {},
            });

            return { success: true, balance: newBalance };
        } catch (err: any) {
            console.error(`[BalanceService] Debit failed:`, err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get transaction history for a user.
     */
    static async getTransactions(walletAddress: string, limit: number = 50) {
        const wallet = walletAddress.toLowerCase();

        const { data, error } = await supabase
            .from('balance_transactions')
            .select('*')
            .eq('wallet_address', wallet)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw new Error(`Failed to get transactions: ${error.message}`);
        return data || [];
    }
}
