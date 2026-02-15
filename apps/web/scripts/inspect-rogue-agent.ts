import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AGENT_ID = "3973a338-5ae7-4938-8563-87feed8a9e4a";

async function inspectAgent() {
    console.log(`Inspecting Agent ${AGENT_ID}...`);
    const { data: session, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('id', AGENT_ID)
        .single();

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log("Session Config:", JSON.stringify(session, null, 2));
}

inspectAgent();
