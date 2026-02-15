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

async function testVaticanDebatesFetch() {
    console.log('Testing Vatican Debates Fetch Logic...');

    const { data: debates, error } = await supabase
        .from('debates')
        .select(`
            *,
            competitor_agents (id, twitter_handle, name)
        `)
        .order('started_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching vatican debates:', error);
    } else {
        console.log('--- Vatican Debate Record ---');
        const formatted = (debates || []).map((d: any) => ({
            id: d.id,
            agentHandle: d.competitor_agents?.twitter_handle || d.competitor_agents?.name || 'Unknown',
            status: d.status,
            createdAt: d.started_at, // Testing the mapped field
        }));
        console.log(JSON.stringify(formatted, null, 2));
    }
}

testVaticanDebatesFetch();
