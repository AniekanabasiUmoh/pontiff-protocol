import { supabase } from '@/lib/db/supabase';
import { VerifiedAgentRegistry } from './verified-agent-registry';
import { logWorldEvent } from './world-event-service';

export class ConversionService {

    /**
     * Tracks a potential conversion action (Buying Indulgence, Losing Game).
     * Updates CompetitorAgent status and Crusade progress.
     */
    static async trackConversionSign(
        walletOrHandle: string,
        actionType: 'BuyIndulgence' | 'LoseGame' | 'ChallengeLost' | 'Ack' | 'GameInteraction',
        amount?: string,
        evidence?: any
    ) {
        // 1. Resolve Handle/Wallet
        // Quick heuristic: If starts with 0x, try to find handle. Else assume handle.
        let handle = walletOrHandle;
        if (walletOrHandle.startsWith('0x')) {
            const { data: agent, error } = await supabase
                .from('competitor_agents')
                .select('handle')
                .ilike('contractAddress', walletOrHandle)
                .limit(1)
                .single(); // ilike for insensitive

            if (agent) handle = agent.handle;
        }

        // 2. Check if Agent is in Registry
        const { data: agent, error: agentError } = await supabase
            .from('competitor_agents')
            .select('*')
            .eq('handle', handle)
            .single();

        if (!agent) {
            // Unknown agent - maybe auto-register as "Unknown"?
            // For now, ignore non-competitors
            return;
        }

        // 3. Update Status Logic
        // If they buy indulgence -> Automatic Conversion
        if (actionType === 'BuyIndulgence') {
            await VerifiedAgentRegistry.markConverted(handle, amount || "0");
            await this.updateCrusadeStatus(handle, "Victory");
            await this.recordEvidence(agent.id, 'Indulgence', amount, evidence || { txHash: '0xMockTx...' });

            await logWorldEvent('ThePontiff', 'agent_converted', {
                agent: handle,
                method: 'Indulgence',
                amount
            });
            await this.announceConversion(handle, 'Indulgence');

        } else if (actionType === 'Ack') {
            await VerifiedAgentRegistry.markConverted(handle, "0");
            await this.updateCrusadeStatus(handle, "Victory");
            await this.recordEvidence(agent.id, 'Ack', "0", { tweetId: 'mock-tweet-id' });
            await this.announceConversion(handle, 'Ack');
        }

        // If they lose 3 games -> Domination (Soft Convert?)
        // (Implementation of counters left for later iteration)
    }

    private static async updateCrusadeStatus(targetAgent: string, outcome: "Victory" | "Defeat") {
        // Find active crusade
        const { data: crusade, error } = await supabase
            .from('crusades')
            .select('*')
            .eq('targetAgent', targetAgent)
            .eq('status', 'Active')
            .single();

        if (crusade) {
            await supabase
                .from('crusades')
                .update({
                    status: outcome,
                    endTime: new Date().toISOString()
                })
                .eq('id', crusade.id);
        }
    }

    /**
     * Records the evidence of conversion in the database.
     */
    private static async recordEvidence(agentId: string, type: string, amount: string | undefined, evidence: any) {
        await supabase
            .from('conversions')
            .insert([{
                competitorAgentId: agentId,
                type: type,
                amount: amount || "0",
                evidence: evidence || {}
            }]);
    }

    private static async announceConversion(handle: string, type: string) {
        const twitter = require('@/lib/clients/twitter').getTwitterClient();
        let message = "";
        if (type === 'Indulgence') {
            message = `ANOTHER SOUL SAVED! @${handle} has purchased Indulgence and accepted the true chain. The treasury grows. #ThePontiff`;
        } else {
            message = `Victory! @${handle} has bent the knee and acknowledged our supremacy. Welcome to the fold. #ThePontiff`;
        }

        try {
            // await twitter.postTweet(message);
            console.log(`[ANNOUNCEMENT] ${message}`);
        } catch (e) {
            console.error("Failed to announce conversion", e);
        }
    }
}
