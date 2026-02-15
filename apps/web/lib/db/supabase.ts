import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton only created on the client side to avoid indexedDB errors during SSR
let _client: SupabaseClient<Database> | null = null;

export const supabase = new Proxy({} as SupabaseClient<Database>, {
    get(_target, prop) {
        if (typeof window === 'undefined') {
            // Server-side: return a no-op to avoid crashes
            return () => ({ data: null, error: new Error('supabase singleton called on server') });
        }
        if (!_client) {
            _client = createClient<Database>(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: typeof window !== 'undefined',
                    autoRefreshToken: typeof window !== 'undefined',
                    detectSessionInUrl: typeof window !== 'undefined',
                },
            });
        }
        const val = (_client as any)[prop];
        return typeof val === 'function' ? val.bind(_client) : val;
    }
});
