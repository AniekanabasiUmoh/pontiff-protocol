import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Server-only Supabase client — no auth/session/IndexedDB
export function createServerSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    return createClient<Database>(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: { 'x-client-info': 'pontiff-server' },
        },
    });
}
