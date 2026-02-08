import { supabase } from '@/lib/db/supabase';

export type WorldEventType = 'confess' | 'stake' | 'betray' | 'challenge' | 'buyIndulgence' | 'enter' | 'debate_initiated' | 'agent_converted' | 'crusade_launched' | 'crusade_resolved' | 'reward_received' | 'poker_move';

export async function logWorldEvent(
    agentWallet: string,
    eventType: WorldEventType,
    eventData: any
) {
    try {
        const { error } = await supabase.from('world_events').insert([{
            agentWallet,
            eventType,
            eventData,
            timestamp: new Date().toISOString()
        }]);

        if (error) {
            console.error("[WorldEvent] Log failed:", error);
        } else {
            console.log(`[WorldEvent] ${eventType} by ${agentWallet}`);
        }
    } catch (error) {
        console.error("Failed to log world event:", error);
        // Don't throw, just log. Logging failure shouldn't block the action.
    }
}
