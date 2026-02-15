import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !supabaseServiceKey)) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey!);

async function testActiveDebateFetch() {
    console.log('Testing Active Debate Fetch Logic...');

    const { data: debates, error } = await supabase
        .from('debates')
        .select(`
            id,
            status,
            competitor_agent_id,
            started_at,
            competitor_agents (
                id,
                name,
                twitter_handle
            )
        `)
        .in('status', ['voting', 'active', 'Active', 'ongoing', 'Pending'])
        .order('started_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching active debates:', error);
    } else {
        console.log('--- Active Debate ---');
        console.log(JSON.stringify(debates, null, 2));
    }
}

testActiveDebateFetch();
