import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
