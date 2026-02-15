import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env before importing services that use it!
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySingleGame() {
    // Dynamic import to ensure env vars are loaded
    const { AgentManagerService } = await import('../lib/services/agent-manager-service');

    const agentId = 'be0afc07-ff41-4c43-9236-e3a3cadb44d6';
    console.log(`🧪 Verifying single game for agent ${agentId}...\n`);

    // Fetch agent
    const { data: session, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('id', agentId)
        .single();

    if (error || !session) {
        console.error('❌ Agent not found:', error);
        return;
    }

    if (session.status !== 'active') {
        console.log(`⚠️ Agent is ${session.status}. Reactivating...`);
        await supabase
            .from('agent_sessions')
            .update({ status: 'active' })
            .eq('id', agentId);
        session.status = 'active'; // Updated local status for check
    }

    console.log('✅ Agent loaded. Session wallet:', session.session_wallet);

    // Run single turn
    const manager = AgentManagerService.getInstance();

    // We access private method by casting to any (for testing purposes)
    // Or we rely on `executeAgentTurn` not being exposed? It is private.
    // But `startAgent` starts loop.
    // We can call `startAgent` and then stop it immediately after one turn? No, it's async loop.

    // Better: We expose `executeAgentTurn` as public temporarily or use `(manager as any).executeAgentTurn`.
    console.log('🚀 Executing single turn...');
    try {
        await (manager as any).executeAgentTurn(
            session.id,
            session.session_wallet,
            session.strategy
        );
        console.log('✅ Turn execution complete.');
    } catch (e) {
        console.error('❌ Turn execution failed:', e);
    }
}

verifySingleGame().catch(console.error);
