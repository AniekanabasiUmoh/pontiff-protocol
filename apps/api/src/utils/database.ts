import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get or create user by wallet address
 */
export async function getOrCreateUser(walletAddress: string) {
    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

    if (existingUser) {
        return existingUser;
    }

    const { data: newUser, error } = await supabase
        .from('users')
        .insert({ wallet_address: walletAddress })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
    }

    return newUser;
}

/**
 * Store identified sins for a wallet
 */
export async function storeSins(userId: string, sins: any[]) {
    const { data, error } = await supabase
        .from('sins')
        .insert(sins.map(sin => ({ ...sin, user_id: userId })))
        .select();

    if (error) {
        throw new Error(`Failed to store sins: ${error.message}`);
    }

    return data;
}

/**
 * Store confession with roast text
 */
export async function storeConfession(
    userId: string,
    walletAddress: string,
    roastText: string,
    writImageUrl?: string
) {
    const { data, error } = await supabase
        .from('confessions')
        .insert({
            user_id: userId,
            wallet_address: walletAddress,
            roast_text: roastText,
            writ_image_url: writImageUrl,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to store confession: ${error.message}`);
    }

    return data;
}
